import express, { Router } from "express";
import department from "./department";
import communication from "./communication";
const router = express.Router();

export default (): Router => {
  department(router);
  communication(router);
  return router;
};
