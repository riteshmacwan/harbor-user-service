import express, { Router } from "express";
import { SkillController } from "../controllers/skill";

const skillController = new SkillController();

const router = express.Router();
export default (router: Router) => {
  router.post("/list-skill", skillController.listSkill);
};
