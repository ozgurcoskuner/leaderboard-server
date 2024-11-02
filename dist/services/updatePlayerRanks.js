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
exports.updatePlayerRanks = void 0;
const redis_1 = require("../config/redis");
const constants_1 = require("../constants");
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
exports.updatePlayerRanks = updatePlayerRanks;
