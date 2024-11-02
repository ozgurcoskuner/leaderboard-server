"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const leaderboardControllers_1 = require("../controllers/leaderboardControllers");
const router = express_1.default.Router();
//cron trigger routes
router.post("/leaderboard/reset-leaderboard", leaderboardControllers_1.resetLeaderboardController);
router.post("/leaderboard/reset-ranking-change", leaderboardControllers_1.resetRankingChangeController);
//test purpose routes
router.post("/simulate-score-update", leaderboardControllers_1.simulateScoreUpdate);
router.post("/add-dummy-players", leaderboardControllers_1.addDummyPlayers);
exports.default = router;
