import express from "express";
import {
  addDummyPlayers,
  resetLeaderboardController,
  resetRankingChangeController,
  simulateScoreUpdate,
} from "../controllers/leaderboardControllers";

const router = express.Router();

//cron trigger routes
router.post("/leaderboard/reset-leaderboard", resetLeaderboardController);
router.post("/leaderboard/reset-ranking-change", resetRankingChangeController);

//test purpose routes
router.post("/simulate-score-update", simulateScoreUpdate);
router.post("/add-dummy-players", addDummyPlayers);

export default router;
