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
exports.leaderboardEventListener = void 0;
const redis_1 = require("../../config/redis");
const constants_1 = require("../../constants");
const index_1 = require("../../index");
const leaderboard_1 = require("./leaderboard");
const leaderboardEventListener = (userMap) => {
    redis_1.subscriber.subscribe(constants_1.GAME_EVENT_CHANNEL, (message) => __awaiter(void 0, void 0, void 0, function* () {
        const { isTop100, affectedPlayersIds } = JSON.parse(message);
        userMap.forEach((_a, socketId_1) => __awaiter(void 0, [_a, socketId_1], void 0, function* ({ playerId: userId }, socketId) {
            try {
                if (isTop100) {
                    const leaderboardData = yield (0, leaderboard_1.getLeaderboard)(userId);
                    index_1.io.emit(constants_1.LEADERBOARD_DATA_EVENT, leaderboardData);
                }
                else if (affectedPlayersIds.includes(userId)) {
                    const leaderboardData = yield (0, leaderboard_1.getLeaderboard)(userId);
                    index_1.io.to(socketId).emit(constants_1.LEADERBOARD_DATA_EVENT, leaderboardData);
                }
            }
            catch (e) {
                console.error(e);
            }
        }));
    }));
};
exports.leaderboardEventListener = leaderboardEventListener;
