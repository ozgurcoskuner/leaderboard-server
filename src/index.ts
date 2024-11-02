import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { getLeaderboard } from "./services/leaderboard/leaderboard";
import {
  connectPubSub,
  connectRedis,
  publisher,
  subscriber,
} from "./config/redis";
import connectDB from "./config/db";
import { leaderboardEventListener } from "./services/leaderboard/leaderboardEventListener";
import { createAdapter } from "@socket.io/redis-adapter";

import {
  CONNECTION_EVENT,
  DISCONNECT_EVENT,
  LEADERBOARD_DATA_EVENT,
  REGISTER_PLAYER_EVENT,
} from "./constants";
import apiRoutes from "./routes/api";

dotenv.config();
const app = express();
const server = createServer(app);
export const io = new Server(server, {
  cors: {
    origin: process.env.LOCAL_CLIENT_URL,
  },
});

const PORT = process.env.PORT || 5000;

const userMap = new Map<string, { playerId: string }>();
io.adapter(createAdapter(publisher, subscriber));
app.use(express.json());
app.use("/api", apiRoutes);

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
    console.log(userMap);
    userMap.forEach((value, key) => {
      console.log(value, "value");
      console.log(key, "key");
    });
    const leaderboardData = await getLeaderboard(playerId);

    socket.emit(LEADERBOARD_DATA_EVENT, leaderboardData);
  });

  socket.on(DISCONNECT_EVENT, () => {
    console.log("User disconnected");
    userMap.delete(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
