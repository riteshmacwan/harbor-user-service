import express, { Router } from "express";
import { SkillController } from "../controllers/skill";

const skillController = new SkillController();
/**
 * @swagger
 * tags:
 *   name: Skill
 *   description: API endpoints for managing skill Routes
 */

export default (router: Router) => {
  /**
   * @swagger
   * /list-skill:
   *   post:
   *     summary:
   *     tags: [Skill]
   *     description: Retrieve a list of skills.
   *     responses:
   *       '200':
   *         description: API is working
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
   *       '400':
   *         description: Bad request
   */
  router.post("/list-skill", skillController.listSkill);
};
