import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { getLeaderboard } from "./services/leaderboard/leaderboard";
import {
  client,
  connectPubSub,
  connectRedis,
  publisher,
  subscriber,
} from "./config/redis";
import connectDB from "./config/db";
import { leaderboardEventListener } from "./services/leaderboard/leaderboardEventListener";
import { handleScoreUpdate } from "./services/player/playerUpdate";
import { createAdapter } from "@socket.io/redis-adapter";
import { distributeMoney } from "./services/leaderboard/distributeMoney";
import {
  CONNECTION_EVENT,
  DISCONNECT_EVENT,
  LEADERBOARD_DATA_EVENT,
  LEADERBOARD_UPDATE,
  RANKING_CHANGE_DAILY,
  REGISTER_PLAYER_EVENT,
} from "./constants";
import { resetLeaderboard } from "./services/leaderboard/resetLeaderboard";
import apiRoutes from "./routes/api";

dotenv.config();
const app = express();
const server = createServer(app);
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

const PORT = process.env.PORT || 5000;

const userMap = new Map<string, { playerId: string }>();
io.adapter(createAdapter(publisher, subscriber));
app.use(express.json());
app.use("/api", apiRoutes); // Use the API routes

(async () => {
  try {
    await connectDB();
    await connectRedis();
    await connectPubSub();
  } catch (e) {
    console.error(e);
  }
})();

leaderboardEventListener(userMap);

io.on(CONNECTION_EVENT, (socket) => {
  console.log("A user connected");

  socket.on(REGISTER_PLAYER_EVENT, async (playerId) => {
    userMap.set(socket.id, { playerId });
    const leaderboardData = await getLeaderboard(playerId);

    socket.emit(LEADERBOARD_DATA_EVENT, leaderboardData);
  });

  socket.on(DISCONNECT_EVENT, () => {
    console.log("User disconnected");
  });
});

app.post("/simulate-score-update", async (req, res) => {
  try {
    const { playerId, newScore } = req.body;
    await handleScoreUpdate(playerId, newScore);
    res.send(`Updated score for playerr ${playerId} to ${newScore}`);
  } catch (error) {
    console.error("Error updating player score:", error);
    res.status(500).send("Error updating player score");
  }
});

app.post("/api/leaderboard/reset-leaderboard", async (req, res) => {
  try {
    await distributeMoney();
    await resetLeaderboard();
    io.emit(LEADERBOARD_UPDATE);
    res.status(200).send("Leaderboard is resetted");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.post("/api/leaderboard/reset-ranking-change", async (req, res) => {
  try {
    await client.del(RANKING_CHANGE_DAILY);
    io.emit(LEADERBOARD_UPDATE);
    res.status(200).send("Daily ranking change resetted");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
