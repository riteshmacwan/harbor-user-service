import express, { Router } from "express";
import { PlanController } from "../controllers";

const planController = new PlanController();
const router = express.Router();

export default (router: Router) => {
  router.post("/list-plan", planController.listPlan);
};
