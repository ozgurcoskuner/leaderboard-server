import { Request, Response } from "express";
import { distributeMoney } from "../services/leaderboard/distributeMoney";
import { resetLeaderboard } from "../services/leaderboard/resetLeaderboard";
import { client } from "../config/redis";
import { RANKING_CHANGE_DAILY, LEADERBOARD_UPDATE } from "../constants";
import { io } from "..";
import { handleScoreUpdate } from "../services/player/playerUpdate";

export const resetLeaderboardController = async (
  req: Request,
  res: Response
) => {
  try {
    await distributeMoney();
    await resetLeaderboard();
    io.emit(LEADERBOARD_UPDATE);
    res.status(200).send("Leaderboard is reset");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};

export const resetRankingChangeController = async (
  req: Request,
  res: Response
) => {
  try {
    await client.del(RANKING_CHANGE_DAILY);
    io.emit(LEADERBOARD_UPDATE);
    res.status(200).send("Daily ranking change reset");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};

export const simulateScoreUpdate = async (req: Request, res: Response) => {
  try {
    const { playerId, newScore } = req.body;
    await handleScoreUpdate(playerId, newScore);
    res.send(`Updated score for player ${playerId} to ${newScore}`);
  } catch (error) {
    console.error("Error updating player score:", error);
    res.status(500).send("Error updating player score");
  }
};
