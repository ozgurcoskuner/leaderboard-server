import { Schema, model } from "mongoose";

const schema = new Schema({
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

const PlayerModel = model("Players", schema);
export default PlayerModel;
