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
exports.updatePlayerScore = void 0;
const redis_1 = require("../config/redis");
const constants_1 = require("../constants");
const updatePlayerRanks_1 = require("./updatePlayerRanks");
const updatePlayerScore = (playerId, newScore) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const oldPlayerRank = yield redis_1.client.zRevRank(constants_1.LEADERBOARD_WEEKLY, playerId);
        yield redis_1.client.zAdd(constants_1.LEADERBOARD_WEEKLY, { score: newScore, value: playerId });
        const newPlayerRank = yield redis_1.client.zRevRank(constants_1.LEADERBOARD_WEEKLY, playerId);
        if (newPlayerRank === null || oldPlayerRank === null)
            return "User not found";
        yield (0, updatePlayerRanks_1.updatePlayerRanks)(playerId, oldPlayerRank, newPlayerRank);
        let surroundingPlayersIds = [];
        if (newPlayerRank < constants_1.TOP_PLAYERS_COUNT) {
            redis_1.publisher.publish(constants_1.GAME_EVENT_CHANNEL, JSON.stringify({ top100: true, playerId }));
        }
        else {
            const surroundingPlayers = yield redis_1.client.zRangeWithScores(constants_1.LEADERBOARD_WEEKLY, Math.max(newPlayerRank - constants_1.ABOVE_PLAYER_COUNT, 0), newPlayerRank + constants_1.BELOW_PLAYER_COUNT, { REV: true });
            surroundingPlayersIds = surroundingPlayers.map(({ value }) => value);
            redis_1.publisher.publish(constants_1.GAME_EVENT_CHANNEL, JSON.stringify({ top100: false, playerId, surroundingPlayersIds }));
        }
    }
    catch (e) {
        console.error(e);
    }
});
exports.updatePlayerScore = updatePlayerScore;
