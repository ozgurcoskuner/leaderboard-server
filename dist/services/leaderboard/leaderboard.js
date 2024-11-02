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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboard = void 0;
const redis_1 = require("../../config/redis");
const playerModel_1 = __importDefault(require("../../models/playerModel"));
const constants_1 = require("../../constants");
const getLeaderboard = (playerId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dailyDiffPipeline = redis_1.client.multi();
        const ranksPipeline = redis_1.client.multi();
        const playerRank = yield redis_1.client.zRevRank(constants_1.LEADERBOARD_WEEKLY, playerId);
        if (playerRank === null) {
            throw new Error("Rank not found");
        }
        const [start, end] = [
            Math.max(playerRank - constants_1.ABOVE_PLAYER_COUNT, 0),
            playerRank + constants_1.BELOW_PLAYER_COUNT,
        ];
        const surroundingPlayers = yield redis_1.client.zRangeWithScores(constants_1.LEADERBOARD_WEEKLY, start, end, { REV: true });
        const top100Players = yield redis_1.client.zRangeWithScores(constants_1.LEADERBOARD_WEEKLY, 0, constants_1.TOP_PLAYERS_COUNT - 1, { REV: true });
        const top100PlayerIds = new Set(top100Players.map((player) => player.value));
        const allPlayers = [
            ...top100Players,
            ...surroundingPlayers.filter((player) => !top100PlayerIds.has(player.value)),
        ];
        const playerIds = allPlayers.map(({ value }) => Number(value));
        const dbPlayers = yield playerModel_1.default.find({ playerId: { $in: playerIds } });
        const dbPlayersMap = new Map(dbPlayers.map((player) => [player.playerId, player.toObject()]));
        allPlayers.forEach(({ value }) => {
            dailyDiffPipeline.hGet(constants_1.RANKING_CHANGE_DAILY, value);
            ranksPipeline.zRevRank(constants_1.LEADERBOARD_WEEKLY, value);
        });
        const [dailyRankDiffs, ranks] = yield Promise.all([
            dailyDiffPipeline.exec(),
            ranksPipeline.exec(),
        ]);
        const leaderboard = allPlayers.map(({ value, score }, index) => (Object.assign(Object.assign({}, dbPlayersMap.get(Number(value))), { weeklyMoney: score, dailyDiff: dailyRankDiffs[index] || 0, rank: (ranks[index] || 0) + 1 })));
        return leaderboard;
    }
    catch (e) {
        console.error(e);
    }
});
exports.getLeaderboard = getLeaderboard;
