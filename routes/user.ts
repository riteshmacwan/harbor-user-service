import express, { Router } from "express";
import { UserController } from "../controllers";

const userController = new UserController();

export default (router: Router) => {
  router.post("/update-user", userController.updateUser);
};
