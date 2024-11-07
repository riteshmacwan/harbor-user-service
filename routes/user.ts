import { Router } from "express";
import { UserController } from "../controllers";
import { userValidation } from "../middlewares/validations/user";
import { validation } from "../middlewares/validations/communication";

const userController = new UserController();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: The User managing API
 */
export default (router: Router) => {
  /**
   * @swagger
   * /update-user:
   *   put:
   *     summary: Update a user
   *     tags: [User]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               user_id:
   *                 type: string
   *               first_name:
   *                 type: string
   *               last_name:
   *                 type: string
   *               email:
   *                 type: string
   *               country_code:
   *                 type: string
   *               phone_number:
   *                 type: string
   *               birth_date:
   *                 type: string
   *               is_profile_set:
   *                 type: boolean
   *               company:
   *                 type: string
   *               gender:
   *                 type: string
   *               about:
   *                 type: string
   *               plan_id:
   *                 type: string
   *               level:
   *                 type: number
   *               language:
   *                 type: string
   *     responses:
   *       '200':
   *         description: User updated
   *       '400':
   *         description: Bad Request
   *
   */
  router.put(
    "/update-user",
    userValidation,
    validation,
    userController.updateUser
  );
};
