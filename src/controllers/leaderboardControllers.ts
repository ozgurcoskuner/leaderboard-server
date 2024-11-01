import { Request, Response } from "express";
import { distributeMoney } from "../services/leaderboard/distributeMoney";
import { resetLeaderboard } from "../services/leaderboard/resetLeaderboard";
import { client } from "../config/redis";
import {
  RANKING_CHANGE_DAILY,
  LEADERBOARD_UPDATE,
  LEADERBOARD_WEEKLY,
} from "../constants";
import { io } from "..";
import { handleScoreUpdate } from "../services/player/playerUpdate";
import PlayerModel from "../models/playerModel";

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

export const addDummyPlayers = async (req: Request, res: Response) => {
  try {
    const pipeline = client.multi();
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
      pipeline.zAdd(LEADERBOARD_WEEKLY, { value: i.toString(), score: i * 10 });
    }
    await Promise.all([PlayerModel.insertMany(dummyPlayers), pipeline.exec()]);
    res.status(200).send("1000 dummy players are added");
  } catch (e) {
    console.error(e);
    res.status(500).send("Error adding dummy players");
  }
};
