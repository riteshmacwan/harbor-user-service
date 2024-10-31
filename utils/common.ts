import dotenv from "dotenv";
import Redis from "ioredis";
import axios from "axios";
import getCurrentLine from "get-current-line";
import { BlobServiceClient } from "@azure/storage-blob";
import { isEmpty } from "lodash";
const twilio = require('twilio');

const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");
dotenv.config();

const credential = new DefaultAzureCredential();
const client = new SecretClient(process.env.KEYVAULT_URI, credential);

/**
 * Utility class providing common functions and operations.
 *
 * This class serves as a collection of commonly used utility methods.
 * It encapsulates functionalities such as handling Redis operations.
 */
export class CommonUtils {
  /**
   * Singleton instance of the CommonUtils class.
   * @private
   * @static
   */
  private static instance: CommonUtils | null = null;
  /**
   * Redis client for handling Redis operations.
   * @private
   */
  private redisClient: any;
  /**
   * Promise representing the initialization of Redis client.
   * @private
   */
  private initializingRedis: Promise<void> | null = null;

  // Singleton access method
  /**
   * Singleton pattern implementation for CommonUtils class.
   * Provides a single instance of CommonUtils throughout the application.
   * @returns {CommonUtils} The singleton instance of CommonUtils.
   */
  public static getInstance(): CommonUtils {
    if (!CommonUtils.instance) {
      const commonUtils = new CommonUtils();
      CommonUtils.instance = commonUtils;
    }
    return CommonUtils.instance;
  }

  /**
   * Initializes the Redis client using configuration from Azure Key Vault.
   */
  private async initializeRedisClient(): Promise<void> {
    let redisHost = { value: "127.0.0.1" };
    let redisPort = { value: "6379" };
    let redisPassword = { value: "" };
    let redisDB = { value: "0" };

    if (process.env.NODE_ENV !== "local") {
      redisHost = await client.getSecret(`${process.env.NODE_ENV}-REDIS-HOST`);
      redisPort = await client.getSecret(`${process.env.NODE_ENV}-REDIS-PORT`);
      redisPassword = await client.getSecret(`${process.env.NODE_ENV}-REDIS-PASSWORD`);
      redisDB = await client.getSecret(`${process.env.NODE_ENV}-REDIS-DB`);
    }

    let redisConfig = {
      host: redisHost.value,
      port: parseInt(redisPort.value, 10),
      password: redisPassword.value,
      db: parseInt(redisDB.value, 10),
    };


    if (process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'stg') {
      redisConfig['tls'] = {};
    }
    this.redisClient = new Redis(redisConfig);
  }

  /**
   * Ensures that the Redis client is initialized before executing subsequent operations.
   * If the Redis client is not already initialized, it initializes the client.
   * If initialization is already in progress, it waits for the initialization to complete before proceeding.
   * @returns {Promise<void>} A Promise that resolves when the Redis client is initialized.
   * @description This method ensures that the Redis client is ready for use by checking if it's already initialized.
   * If the client is not initialized, it starts the initialization process, ensuring that only one initialization
   * occurs at a time. Once the initialization completes, subsequent calls to this method will not re-initialize
   * the client, ensuring efficient resource usage.
   */
  public async ensureRedisInitialized(): Promise<void> {
    if (!this.redisClient) {
      if (!this.initializingRedis) {
        console.log("Redis New Initialise connection called ==> ");
        this.initializingRedis = this.initializeRedisClient();
      }
      await this.initializingRedis;
      this.initializingRedis = null; // Reset for future re-initializations if needed
    }
  }

  /**
   * Asynchronously sets a value in the cache with an optional time-to-live (TTL) using Redis.
   *
   * @async
   * @param {string} key - The key under which to store the data in the cache.
   * @param {any} data - The data to store in the cache.
   * @param {number} [ttl=30] - The time-to-live for the cached data in seconds. Default is 30 seconds.
   * @returns {Promise<void>} A Promise that resolves when the data is successfully cached, or rejects with an error.
   * @throws {Error} Throws an error if there is a failure in setting the cache.
   */
  setCache = async (key: string, data: any, ttl = 30) => {
    await this.ensureRedisInitialized();
    try {
      // Serialize data to JSON before storing in Redis
      const jsonData = JSON.stringify(data);
      // Use the set method of ioredis with the 'EX' option to set TTL in seconds
      await this.redisClient.set(key, jsonData, "EX", ttl);
    } catch (error) {
      throw new Error("Failed to set cache"); // Throw an error to reject the promise
    }
  };

  /**
   * Retrieves data from the cache corresponding to the provided key.
   *
   * This function ensures that the Redis client is initialized before attempting to retrieve data from the cache.
   * If data corresponding to the provided key is found in the cache, it is returned after parsing it safely from JSON.
   * If the data is not found in the cache or if any error occurs during the process, null is returned.
   *
   * @async
   * @param {any} key - The key used to retrieve data from the cache.
   * @returns {Promise<any>} A Promise that resolves with the cached data, or null if the data is not found or an error occurs.
   */
  getCache = async (key: any) => {
    try {
      await this.ensureRedisInitialized();
      const cachedData = await this.redisClient.get(key);
      return cachedData ? this.safeJSONParse(cachedData) : null;
    } catch (error) {
      return null;
    }
  };

  /**
   * Retrieves a secret from Key Vault and caches it if not already cached.
   * @param {string} secretName - The name of the secret to retrieve.
   * @returns {Promise<string|null>} The value of the secret if retrieved successfully, otherwise null.
   */
  getSecret = async (secretName: string) => {
    try {
      const keyValutKey = secretName;
      const cachedData = await this.getCache(keyValutKey);
      if (cachedData) {
        return cachedData;
      }
      // Retrieve the secret from Key Vault
      const secret = await client.getSecret(secretName);
      if (!secret) {
        throw new Error("Failed to retrieve secret from Key Vault");
      }
      await this.setCache(keyValutKey, secret.value, 86400);
      return secret.value;
    } catch (error) {
      return null;
    }
  };

  /**
   * Retrieves sender email addresses and names from the SendGrid API.
   * If available, retrieves cached data; otherwise, fetches data from the API, caches it, and returns it.
   *
   * @async
   * @function getSenderEmail
   * @memberof YourClassName
   * @returns {Promise<Array<{ email: string, name: string }>>} An array of objects containing sender email addresses and names.
   * @throws {Error} If an error occurs during the retrieval process.
   */
  async getSenderEmail() {
    // const cacheEmails = "cachedEmails";
    // const cachedData = await this.getCache(cacheEmails);
    // if (cachedData) {
    //   return cachedData;
    // }
    const apiUrl = "https://api.sendgrid.com/v3/senders";
    const authToken = await this.getSecret("SENDGRID-KEY-SECRET");

    try {
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      // Extracting email and name properties
      const formattedData = response.data.map((sender) => ({
        email: sender.from?.email,
        name: sender.from?.name,
      }));
      // await this.setCache(cacheEmails, formattedData, 86400);
      return formattedData;
    } catch (error) {
      console.error("Error getSenderEmail:", error);
      return null;
    }
  }

  async getSenderPhone(){
    const cachedPhone = "cachedPhone";
    const cachedData = await this.getCache(cachedPhone);
    if (cachedData) {
      return cachedData;
    }

    const accountSid = await this.getSecret(`${process.env.NODE_ENV ?? "local"}-TWILIO-ACCOUNTSID`);
    const authToken = await this.getSecret(`${process.env.NODE_ENV ?? "local"}-TWILIO-AUTHTOKEN`);
    const apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`;
    const client = twilio(accountSid, authToken);
    console.log("client", client);
    try {
      const response = await axios.get(apiUrl, {
        auth: {
          username: accountSid,
          password: authToken,
        },
      });
      let stateArray = {
        "+12673769392" : "Pennsylvania",
        "+15055941133" : "New Mexico",
        "+18302837997" : "Texas",
        "+16469418585" : "New York",
        "+19452980007" : "Texas",
        "+13135131616" : "Michigan",
        "+17086161313" : "Illinois",
        "+19036003627" : "Texas",
        "+18489995778" : "New Jersey",
        "+18574109993" : "Massachusett",
        "+16232320800" : "Arizona",
        "+14253998006" : "Washington",
        "+18336300203" : "Texas",
        "+13617333627" : "Texas",
        "+13465509559" : "Texas",
        "+17752586400" : "Nevada",
      }
      let cityArray = {
        "+12673769392" : "Philadelphia",
        "+15055941133" : "Albuquerque",
        "+18302837997" : "San Antonio",
        "+16469418585" : "New York",
        "+19452980007" : "Dallas",
        "+13135131616" : "Detroit",
        "+17086161313" : "Chicago",
        "+19036003627" : "Texas",
        "+18489995778" : "New Jersey",
        "+18574109993" : "Boston",
        "+16232320800" : "Pheonix",
        "+14253998006" : "Seattle",
        "+18336300203" : "Texas",
        "+13617333627" : "Texas",
        "+13465509559" : "Houston",
        "+17752586400" : "Reno",
      }
      const formattedData : any = [];
      const environment = process.env.NODE_ENV;
      if(response && response.data && response.data.incoming_phone_numbers){
        for (const number of response.data.incoming_phone_numbers) {
          if (environment === 'qa' && number.phone_number !== '+13617333627') {
            continue;
          }

          if (environment === 'staging' && number.phone_number == '+13617333627') {
            continue;
          }

        formattedData.push({
          phone: number.phone_number,
          state : stateArray[number?.phone_number],
          city : cityArray[number?.phone_number]
        });
        }
        await this.setCache("cachedPhone",formattedData,86400)
        return formattedData;
      }
      return null;
    } catch (error) {
      console.error("Error getSenderEmail:", error);
      return null;
    }
  }

  /**
   * Asynchronously calculates pagination information based on the total count of items,
   * the current page number, and the page size.
   *
   * @param {number} totalCount - The total number of items.
   * @param {number} currentPage - The current page number.
   * @param {number} pageSize - The number of items per page.
   * @returns {Promise<Object>} A promise that resolves to an object containing pagination details:
   */
  pagination = async (totalCount: number, currentPage: number, pageSize: number) => {
    // Calculate the total number of pages based on the total count and page size.
    let totalPage = Math.ceil(totalCount / pageSize);

    // Check if there are more pages after the current page.
    let isMore = totalPage <= currentPage;

    let pagination = {
      totalCount: totalCount, // Total number of items.
      pageSize: pageSize, // Number of items per page.
      totalPage: totalPage, // Total number of pages.
      currentPage: currentPage, // Current page number.
      isMore: isMore, // Flag indicating if there are more pages after the current page.
    };
    return pagination;
  };

  /**
   * Tries to parse a string as JSON. Returns the parsed JSON or the original string if parsing fails.
   * @param {string} data - The string to parse as JSON.
   * @returns {any} - The parsed JSON object if data is a valid JSON string, otherwise the original string.
   */
  safeJSONParse(data: string): any {
    try {
      return JSON.parse(data);
    } catch (e) {
      return data; // Return the original data if it's not JSON
    }
  }

  /**
   * Retrieves the current location within the code.
   *
   * This function returns a string representing the current location within the codebase, including the file name,
   * line number, and character position.
   *
   * @returns {string} A string indicating the current location in the format "Location: [file]:[line]:[char]".
   */
  getCurrentLocation(): string {
    const cLine = getCurrentLine();
    return `Location: ${cLine.file}:${cLine.line}:${cLine.char}`;
  }

  /**
   * Uploads a image file to a Blob storage container.
   * @async
   * @param {string} base64Data - The base64-encoded data of the image file.
   * @param {string} blobName - The name of the Blob to upload the image to.
   * @returns {Promise<string|null>} - A Promise that resolves with the URL of the uploaded Blob, or null if an error occurs.
   */
  uploadImage = async (body, blobName) => {
    try {
      let base64Data = body.image;
      const blobSecret = await this.getSecret("BLOB-CONNECTION-STRING");
      const blobServiceClient = BlobServiceClient.fromConnectionString(blobSecret);
      // Get a reference to a container
      const containerClient = blobServiceClient.getContainerClient("commodule");

      // Create the container if it does not exist
      await containerClient.createIfNotExists({
        access: "container",
      });

      const options = {
        blobHTTPHeaders: {
            blobContentType: "image/"+body.type
        },
    };

      // Convert base64 data to binary buffer
      const binaryData = Buffer.from(base64Data, "base64");
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      const uploadBlobResponse = await blockBlobClient.upload(binaryData, binaryData.length,options);
      const blobUrl = blockBlobClient.url;
      return blobUrl;
    } catch (error) {
      return null;
    }
  };
}
