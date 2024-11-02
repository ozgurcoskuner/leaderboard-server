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
exports.addDummyPlayers = exports.simulateScoreUpdate = exports.resetRankingChangeController = exports.resetLeaderboardController = void 0;
const distributeMoney_1 = require("../services/leaderboard/distributeMoney");
const resetLeaderboard_1 = require("../services/leaderboard/resetLeaderboard");
const redis_1 = require("../config/redis");
const constants_1 = require("../constants");
const __1 = require("..");
const playerUpdate_1 = require("../services/player/playerUpdate");
const playerModel_1 = __importDefault(require("../models/playerModel"));
// google scheduler hits every Sunday
const resetLeaderboardController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, distributeMoney_1.distributeMoney)();
        yield (0, resetLeaderboard_1.resetLeaderboard)();
        yield redis_1.client.del(constants_1.RANKING_CHANGE_DAILY);
        __1.io.emit(constants_1.LEADERBOARD_UPDATE);
        res.status(200).send("Leaderboard is resetted");
    }
    catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});
exports.resetLeaderboardController = resetLeaderboardController;
// google scheduler hits daily
const resetRankingChangeController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield redis_1.client.del(constants_1.RANKING_CHANGE_DAILY);
        __1.io.emit(constants_1.LEADERBOARD_UPDATE);
        res.status(200).send("Daily ranking change reset");
    }
    catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});
exports.resetRankingChangeController = resetRankingChangeController;
const simulateScoreUpdate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { playerId, newScore } = req.body;
        yield (0, playerUpdate_1.handleScoreUpdate)(playerId, newScore);
        res.send(`Updated score for player ${playerId} to ${newScore}`);
    }
    catch (error) {
        console.error("Error updating player score:", error);
        res.status(500).send("Error updating player score");
    }
});
exports.simulateScoreUpdate = simulateScoreUpdate;
const addDummyPlayers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pipeline = redis_1.client.multi();
        const countryList = [
            "Türkiye",
            "Germany",
            "Greece",
            "USA",
            "Cyprus",
            "Holland",
        ];
        const dummyPlayers = [];
        for (let i = 0; i < 1000; i++) {
            dummyPlayers.push({
                playerId: i,
                username: "player" + i,
                country: countryList[i % countryList.length],
                totalMoney: 0,
            });
            pipeline.zAdd(constants_1.LEADERBOARD_WEEKLY, { value: i.toString(), score: i * 10 });
        }
        yield Promise.all([playerModel_1.default.insertMany(dummyPlayers), pipeline.exec()]);
        res.status(200).send("1000 dummy players are added");
    }
    catch (e) {
        console.error(e);
        res.status(500).send("Error adding dummy players");
    }
});
exports.addDummyPlayers = addDummyPlayers;
