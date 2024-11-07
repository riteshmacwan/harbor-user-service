import { Router } from "express";
import { PlanController } from "../controllers";

const planController = new PlanController();
/**
 * @swagger
 * tags:
 *  name: Plan
 *  description: API endpoints for managing plan routes
 */

export default (router: Router) => {
  /**
   * @swagger
   * /list-plan:
   *   post:
   *     summary: Retrieve a list of plans.
   *     tags: [Plan]
   *     description: Retrieve a list of available plans.
   *     responses:
   *       '200':
   *         description: Successfully retrieved list of plans.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       planId:
   *                         type: string
   *                       planName:
   *                         type: string
   *                       price:
   *                         type: number
   *       '400':
   *         description: Bad request, invalid parameters
   */
  router.post("/list-plan", planController.listPlan);
};
