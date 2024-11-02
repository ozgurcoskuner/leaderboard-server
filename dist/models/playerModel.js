"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    playerId: {
        type: Number,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    totalMoney: {
        type: Number,
        required: true,
    },
});
const PlayerModel = (0, mongoose_1.model)("Players", schema);
exports.default = PlayerModel;
