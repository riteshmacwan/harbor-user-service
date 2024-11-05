import appInsightsUtils from "./utils/appInsightsUtils";
import express, { Express, Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan, { TokenIndexer } from "morgan";
import fs from "fs";
import moment from "moment";
import path, { join } from "path";
import router from "./routes";
import { connectMongoDb } from "./config/mongodb";
import dotenv from "dotenv";
import "reflect-metadata";
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerDocument from "./swagger.json";
import { ProcessCommunicationService } from "./service";
import {
  CommunicationStatus,
  CommunicationType,
  FrequencyConfigType,
  FrequencyType,
  StudyVisitType,
} from "./types/communication";
import { ServiceBusUtils } from "./utils/serviceBus";
dotenv.config();
const HOST = process.env.HOST_URL ?? "localhost";
const PORT = process.env.HOST_PORT ?? 3002;

const app: Express = express();

// Initialize Application Insights
// appInsightsUtils;
// appInsightsUtils.initialize();

// appInsightsUtils.logMessage("Mass Comm: Application is starting...");

// for ts-doc
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Serve documentation files from the 'docs' directory
app.use("/docs", express.static(path.join(__dirname, "docs")));

const specs = swaggerJsDoc(swaggerDocument);
app.use("/mass-com/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

// disable `X-Powered-By` header that reveals information about the server
app.disable("x-powered-by");

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(
  bodyParser.json({
    limit: "20mb",
  })
);

// parse urlencoded request body
app.use(bodyParser.urlencoded({ extended: true, limit: "20mb" }));

// enable cors
app.use(cors());
app.options("*", cors());

// Health Check Route
app.get("/user/health-check", (req, res) => {
  res.status(200).json({ health: "okay" });
});

// Generate Request & Response Logs
app.use((req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  res.json = function (body): any {
    res.locals.responseJson = body;
    originalJson.call(this, body);
  };
  next();
});

morgan.token("response-json", (req: Request, res: Response) => {
  return JSON.stringify(res.locals.responseJson);
});

app.use(
  morgan(
    (
      tokens: TokenIndexer<Request, Response>,
      req: Request,
      res: Response
    ): any => {
      const log = [
        "Method: " + tokens.method(req, res),
        "Url: " + tokens.url(req, res),
        "User_id: " + (req as any)?.user?._id,
        "Status: " + tokens.status(req, res),
        "Date: " + tokens.date(req, res),
        "Content-length: " + tokens.res(req, res, "content-length"),
        "Time: " + tokens["response-time"](req, res) + "ms",
        "Request: " + JSON.stringify(req?.body || req?.query),
        "Response: " + tokens["response-json"](req, res),
      ].join("\n");

      const logDirectory = join(__dirname, "./logs/req_res_logs");
      const date = moment().format("YYYY-MM-DD");
      const logFilePath = join(logDirectory, `log_${date}.log`);

      // Ensure log directory exists
      if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory, { recursive: true, mode: "00755" });
      }

      const logData = [
        `---------------------------------START LOG---------------------------------\n${log}\n----------------------------------END LOG----------------------------------`,
      ];

      // Write log data
      fs.appendFile(logFilePath, `\n${logData}\n`, (err) => {
        if (err) {
          console.error("Error writing to log file:", err);
        }
      });
    }
  )
);

connectMongoDb();

app.use("/user", router());

app.use("/", async (req: Request, res: Response) => {
  return res.json({
    message: "Welcome to Harbor User Service",
  });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, async () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);

    // Start Listening to Service Bus Queue Messages
    // To handle internal service communication
    // const serviceBusUtils = ServiceBusUtils.getInstance();
    // Subscribing to messages
    // serviceBusUtils.startListening(
    //   `${process.env.NODE_ENV ?? "local"}_services_communication`,
    //   true,
    //   "mass-com-listener"
    // );
  });
}

export default app;
