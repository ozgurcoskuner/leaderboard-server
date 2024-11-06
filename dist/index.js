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
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const leaderboard_1 = require("./services/leaderboard/leaderboard");
const redis_1 = require("./config/redis");
const db_1 = __importDefault(require("./config/db"));
const leaderboardEventListener_1 = require("./services/leaderboard/leaderboardEventListener");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const constants_1 = require("./constants");
const api_1 = __importDefault(require("./routes/api"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
exports.io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.LOCAL_CLIENT_URL,
    },
});
const PORT = process.env.PORT || 5000;
const userMap = new Map();
exports.io.adapter((0, redis_adapter_1.createAdapter)(redis_1.publisher, redis_1.subscriber));
app.use(express_1.default.json());
app.use("/api", api_1.default);
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, db_1.default)();
        yield (0, redis_1.connectRedis)();
        yield (0, redis_1.connectPubSub)();
    }
    catch (e) {
        console.error(e);
    }
}))();
(0, leaderboardEventListener_1.leaderboardEventListener)(userMap);
exports.io.on(constants_1.CONNECTION_EVENT, (socket) => {
    console.log("A user connected");
    socket.on(constants_1.REGISTER_PLAYER_EVENT, (playerId) => __awaiter(void 0, void 0, void 0, function* () {
        userMap.set(socket.id, { playerId });
        const leaderboardData = yield (0, leaderboard_1.getLeaderboard)(playerId);
        socket.emit(constants_1.LEADERBOARD_DATA_EVENT, leaderboardData);
    }));
    socket.on(constants_1.DISCONNECT_EVENT, () => {
        console.log("User disconnected");
        userMap.delete(socket.id);
    });
});
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
