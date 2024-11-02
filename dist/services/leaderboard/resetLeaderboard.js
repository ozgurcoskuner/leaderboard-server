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
exports.resetLeaderboard = void 0;
const redis_1 = require("../../config/redis");
const constants_1 = require("../../constants");
const resetLeaderboard = () => __awaiter(void 0, void 0, void 0, function* () {
    const allPlayers = yield redis_1.client.zRangeWithScores(constants_1.LEADERBOARD_WEEKLY, 0, -1);
    const pipeline = redis_1.client.multi();
    allPlayers.forEach(({ value }) => pipeline.zAdd(constants_1.LEADERBOARD_WEEKLY, { value, score: 0 }));
    pipeline.exec();
});
exports.resetLeaderboard = resetLeaderboard;
