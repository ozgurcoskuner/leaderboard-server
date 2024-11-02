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
exports.distributeMoney = void 0;
const redis_1 = require("../../config/redis");
const constants_1 = require("../../constants");
const playerModel_1 = __importDefault(require("../../models/playerModel"));
const distributeMoney = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allPlayers = yield redis_1.client.zRangeWithScores(constants_1.LEADERBOARD_WEEKLY, 0, -1, {
            REV: true,
        });
        const totalMoney = allPlayers.reduce((acc, cur) => acc + cur.score, 0);
        const prizePool = totalMoney * constants_1.PRIZE_POOL_RATIO;
        const [firstPlayer, secondPlayer, thirdPlayer, ...remainingPlayers] = allPlayers.slice(0, constants_1.TOP_PLAYERS_COUNT);
        const firstPlayerReward = prizePool * constants_1.REWARDS[1];
        const secondPlayerReward = prizePool * constants_1.REWARDS[2];
        const thirdPlayerReward = prizePool * constants_1.REWARDS[3];
        const paymentToTopPlayers = [
            {
                playerId: Number(firstPlayer.value),
                earnedMoney: Math.round(firstPlayerReward + firstPlayer.score),
            },
            {
                playerId: Number(secondPlayer.value),
                earnedMoney: Math.round(secondPlayerReward + secondPlayer.score),
            },
            {
                playerId: Number(thirdPlayer.value),
                earnedMoney: Math.round(thirdPlayerReward + thirdPlayer.score),
            },
        ];
        const remainingPrize = prizePool - (firstPlayerReward + secondPlayerReward + thirdPlayerReward);
        const rewardForEachRemainingPlayer = Math.round(remainingPrize / remainingPlayers.length);
        const rewardsToRemainingPlayers = remainingPlayers.map(({ value, score }) => ({
            playerId: Number(value),
            earnedMoney: rewardForEachRemainingPlayer + score,
        }));
        const bulkOperations = [
            ...paymentToTopPlayers.map(({ playerId, earnedMoney }) => ({
                updateOne: {
                    filter: { playerId },
                    update: { $inc: { totalMoney: earnedMoney } },
                },
            })),
            ...rewardsToRemainingPlayers.map(({ playerId, earnedMoney }) => ({
                updateOne: {
                    filter: { playerId },
                    update: { $inc: { totalMoney: earnedMoney } },
                },
            })),
        ];
        yield playerModel_1.default.bulkWrite(bulkOperations);
    }
    catch (e) {
        console.error(e);
    }
});
exports.distributeMoney = distributeMoney;
