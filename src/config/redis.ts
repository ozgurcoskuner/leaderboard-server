import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const client = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

client.on("error", (err) => console.log("Redis error", err));

const connectRedis = async () => {
  try {
    await client.connect();
  } catch (e) {
    console.error(e);
  }
};
const publisher = client.duplicate();
const subscriber = client.duplicate();

const connectPubSub = async () => {
  try {
    await publisher.connect();
    await subscriber.connect();
  } catch (e) {
    console.error(e);
  }
};

export { client, publisher, subscriber, connectRedis, connectPubSub };
