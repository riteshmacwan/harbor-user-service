import { Sequelize } from "sequelize-typescript";
import dotenv from "dotenv";
dotenv.config();
import {CommonUtils} from "../utils";
const commonUtils = CommonUtils.getInstance();

/**
 * Configuration object containing environment variables for MSSQL connection.
 * @types {Object} MSSQLConfig
 * @property {string} MSSQL_HOST - The host name for MSSQL connection.
 * @property {number} MSSQL_PORT - The port for MSSQL connection.
 * @property {string} MSSQL_DB - The database name for MSSQL connection.
 * @property {string} MSSQL_USERNAME - The username for MSSQL connection.
 * @property {string} MSSQL_PASSWORD - The password for MSSQL connection.
 * @property {string} MSSQL_DIALECT - The dialect for MSSQL connection.
 */
let sequelizeInstance: Sequelize | null = null;

/**
 * Connects to a MSSQL database using Sequelize ORM.
 * @async
 * @returns {Promise<object>} A promise that resolves to an object containing Sequelize and sequelize instances.
 * @throws {Error} Throws an error if required environment variables for MSSQL connection are missing.
 */
export const connectMssqlDb = async () => {
  try {
    const db: any = {};
    db.Sequelize = Sequelize;
    if (sequelizeInstance) {
      console.log("Connection cache working");
      db.sequelize = sequelizeInstance;
      return db;
    }
    const MSSQL_HOST = await commonUtils.getSecret(`${process.env.NODE_ENV}-MSSQL-HOST`);
    const MSSQL_DB = await commonUtils.getSecret(`${process.env.NODE_ENV}-MSSQL-DB`);
    const MSSQL_USERNAME = await commonUtils.getSecret(`${process.env.NODE_ENV}-MSSQL-USERNAME`);
    const MSSQL_PASSWORD = await commonUtils.getSecret(`${process.env.NODE_ENV}-MSSQL-PASSWORD`);
    const MSSQL_PORT = await commonUtils.getSecret(`${process.env.NODE_ENV}-MSSQL-PORT`);

    const MSSQL_DIALECT = "mssql"
    // Check if all required environment variables are present
    if (!MSSQL_HOST || !MSSQL_PORT || !MSSQL_DB || !MSSQL_USERNAME || !MSSQL_PASSWORD || !MSSQL_DIALECT) {
      throw new Error("Missing required environment variables for MSSQL connection");
    }

    /**
     * The Sequelize instance for MSSQL connection.
     * @types {Sequelize}
     */
    sequelizeInstance = new Sequelize(MSSQL_DB, MSSQL_USERNAME, MSSQL_PASSWORD, {
      host: MSSQL_HOST,
      port: parseInt(MSSQL_PORT),
      dialect: MSSQL_DIALECT as "mssql",
      repositoryMode: true,
      pool: {
        max: 500, // Increase pool size based on your server's capacity
        min: 50,
        acquire: 30000,
        idle: 10000,
      },
    });

    // Add models to Sequelize instance

    /**
     * Database object containing Sequelize and sequelize instances.
     * @type {Object}
     */
    db.sequelize = sequelizeInstance;
    return db;
    
    return db;
  } catch (error) {
    // Log any errors that occur during the connection process
    console.log(`MSSQL Connection Error: ${error}`);
    throw error;
  }
};
