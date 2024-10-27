import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { getLeaderboard } from "./services/leaderboardService";
import {
  connectPubSub,
  connectRedis,
  publisher,
  subscriber,
} from "./config/redis";
import connectDB from "./config/db";
import { startListeningToGameEvents } from "./services/gameEventService";
import { updatePlayerScore } from "./services/playerService";
import { createAdapter } from "@socket.io/redis-adapter";
dotenv.config();
const app = express();
const server = createServer(app);
export const io = new Server(server);

const PORT = process.env.PORT || 5000;

const userMap = new Map<string, { playerId: string }>();
io.adapter(createAdapter(publisher, subscriber));
connectDB();
connectRedis();
connectPubSub().then(() => startListeningToGameEvents(userMap));

app.use(express.json());

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("registerPlayer", async () => {
    const playerId = "123";
    userMap.set(socket.id, { playerId });
    const leaderboardData = await getLeaderboard(playerId);

    socket.emit("leaderboardData", leaderboardData);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

app.post("/simulate-score-update", async (req, res) => {
  try {
    const { playerId, newScore } = req.body;
    await updatePlayerScore(playerId, newScore);
    res.send(`Updated score for playerr ${playerId} to ${newScore}`);
  } catch (error) {
    console.error("Error updating player score:", error);
    res.status(500).send("Error updating player score");
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
