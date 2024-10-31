import mongoose from "mongoose";
const { MongoMemoryServer } = require("mongodb-memory-server");
import dotenv from "dotenv";
import { CommonUtils } from "../utils";

let mongoServer;

dotenv.config();

const environment = process.env.NODE_ENV;
const commonUtils = CommonUtils.getInstance();

/**
 * Generates MongoDB connection URL based on environment variables.
 * @returns {Promise<string>} The generated MongoDB connection URL.
 */
const generateMongoDbUrl = async (): Promise<string> => {
  let MONGODB_URL = "";
  if (environment === "local") {
    // MONGODB_URL = await commonUtils.getSecret("local-db-connection-string");
    MONGODB_URL = "mongodb://localhost:27017/testDM";
  } else {
    const DB_USERNAME = await commonUtils.getSecret(
      `${process.env.NODE_ENV}-DB-USERNAME`
    );
    const DB_PASSWORD = await commonUtils.getSecret(
      `${process.env.NODE_ENV}-DB-PASSWORD`
    );
    const DB_HOST = await commonUtils.getSecret(
      `${process.env.NODE_ENV}-DB-HOST`
    );
    const DB_PORT = await commonUtils.getSecret(
      `${process.env.NODE_ENV}-DB-PORT`
    );
    const DB_NAME = await commonUtils.getSecret(
      `${process.env.NODE_ENV}-DB-NAME`
    );
    const additionalParams =
      "ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000";
    MONGODB_URL = `mongodb://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${encodeURIComponent(
      DB_NAME
    )}?${additionalParams}`;
  }
  return MONGODB_URL;
};

/**
 * Connects to MongoDB using the provided MongoDB URL.
 * @returns {Promise<void>} A promise that resolves when the connection is established successfully.
 */
const connectMongoDb = async (): Promise<void> => {
  try {
    let MONGODB_URL;
    if (process.env.NODE_ENV === "test") {
      mongoServer = await MongoMemoryServer.create();
      MONGODB_URL = mongoServer.getUri();
    } else {
      MONGODB_URL = await generateMongoDbUrl();
    }
    await mongoose.connect(MONGODB_URL);

    // Log successful connection
    console.log("Mongodb connected successfully.");
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error}`);
  }
};

const disconnectDB = async (): Promise<void> => {
  try {
    // Disconnect from MongoDB
    await mongoose.disconnect();

    // Stop the MongoDB Memory Server if it's running
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (err) {
    // Handle errors
    // console.log(err);
    // process.exit(1);

    console.error("Error disconnecting from MongoDB:", err);
    throw err; // Rethrow the error to indicate test failure
  }
};

export { connectMongoDb, disconnectDB, generateMongoDbUrl };
