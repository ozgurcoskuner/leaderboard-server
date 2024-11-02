"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleScoreUpdate = void 0;
const redis_1 = require("../../config/redis");
const constants_1 = require("../../constants");
const updatePlayerScore = (playerId, newScore) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield redis_1.client.zAdd(constants_1.LEADERBOARD_WEEKLY, { score: newScore, value: playerId });
    }
    catch (e) {
        console.error(e);
    }
});
const updatePlayerRanks = (playerId, oldPlayerRank, newPlayerRank) => __awaiter(void 0, void 0, void 0, function* () {
    const pipeline = redis_1.client.multi();
    const rankDiff = oldPlayerRank - newPlayerRank;
    if (rankDiff != 0) {
        const [start, end] = rankDiff > 0
            ? [newPlayerRank + 1, oldPlayerRank]
            : [oldPlayerRank, newPlayerRank - 1];
        const changedRankDiffPlayers = yield redis_1.client.zRangeWithScores(constants_1.LEADERBOARD_WEEKLY, start, end, { REV: true });
        pipeline.hIncrBy(constants_1.RANKING_CHANGE_DAILY, playerId, rankDiff);
        changedRankDiffPlayers.forEach(({ value }) => pipeline.hIncrBy(constants_1.RANKING_CHANGE_DAILY, value, rankDiff > 0 ? -1 : 1));
    }
    yield pipeline.exec();
});
const updateAffectedPlayers = (oldPlayerRank, newPlayerRank) => __awaiter(void 0, void 0, void 0, function* () {
    const isTop100 = newPlayerRank < constants_1.TOP_PLAYERS_COUNT || oldPlayerRank < constants_1.TOP_PLAYERS_COUNT;
    const pipeline = redis_1.client.multi();
    pipeline.zRange(constants_1.LEADERBOARD_WEEKLY, Math.max(oldPlayerRank - constants_1.BELOW_PLAYER_COUNT, 0), oldPlayerRank + constants_1.ABOVE_PLAYER_COUNT, { REV: true });
    pipeline.zRange(constants_1.LEADERBOARD_WEEKLY, Math.max(newPlayerRank - constants_1.BELOW_PLAYER_COUNT, 0), newPlayerRank + constants_1.ABOVE_PLAYER_COUNT, { REV: true });
    const result = yield pipeline.exec();
    const surrondingPlayersSet = new Set(result.flat());
    const surroundingPlayersIds = Array.from(surrondingPlayersSet);
    redis_1.publisher.publish(constants_1.GAME_EVENT_CHANNEL, JSON.stringify({ isTop100, surroundingPlayersIds }));
});
const handleScoreUpdate = (playerId, newScore) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const oldPlayerRank = yield redis_1.client.zRevRank(constants_1.LEADERBOARD_WEEKLY, playerId);
        yield updatePlayerScore(playerId, newScore);
        const newPlayerRank = yield redis_1.client.zRevRank(constants_1.LEADERBOARD_WEEKLY, playerId);
        if (newPlayerRank === null || oldPlayerRank === null) {
            throw new Error("Rank not found");
        }
        yield updatePlayerRanks(playerId, oldPlayerRank, newPlayerRank);
        yield updateAffectedPlayers(oldPlayerRank, newPlayerRank);
    }
    catch (e) {
        console.error(e);
    }
});
exports.handleScoreUpdate = handleScoreUpdate;
