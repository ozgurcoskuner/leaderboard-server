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
exports.connectPubSub = exports.connectRedis = exports.subscriber = exports.publisher = exports.client = void 0;
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client = (0, redis_1.createClient)({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
    },
});
exports.client = client;
client.on("error", (err) => console.log("Redis error", err));
const connectRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield client.connect();
    }
    catch (e) {
        console.error(e);
    }
});
exports.connectRedis = connectRedis;
const publisher = client.duplicate();
exports.publisher = publisher;
const subscriber = client.duplicate();
exports.subscriber = subscriber;
const connectPubSub = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield publisher.connect();
        yield subscriber.connect();
    }
    catch (e) {
        console.error(e);
    }
});
exports.connectPubSub = connectPubSub;
