import express, { Router } from "express";
import { DepartmentController } from "../controllers/department";

const departmentController = new DepartmentController();
const router = express.Router();


/**
 * @swagger
 * components:
 *   schemas:
 *     Department:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the mass-communication
 *         name:
 *           type: string
 *           description: The mass-communication name
 */

/**
 * @swagger
 * tags:
 *   name: mass-communication
 *   description: The mass-communication managing API
 */
export default (router: Router) => {
    /**
   * @swagger
   * /create-department:
   *   post:
   *     summary: Create a new department
   *     tags: [Department]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *     responses:
   *       200:
   *         description: 
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Department'
   */
    router.post("/create-department", departmentController.createDepartment)

    /**
   * @swagger
   * /list-department:
   *   get:
   *     summary: Get a list of all departments
   *     tags: [Department]
   *     responses:
   *       '200':
   *         description: A list of departments
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Department'
   */
    router.get("/list-department", departmentController.listDepartment)

    /**
     * @swagger
     * /delete-department:
     *   post:
     *     summary: Delete a new department
     *     tags: [Department]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               _id:
     *                 type: string
     *     responses:
     *       200:
     *         description: 
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Department'
     */
    router.post("/delete-department", departmentController.deleteDepartment)
    /**
     * @swagger
     * /update-department:
     *   post:
     *     summary: Update a department by ID
     *     tags: [Department]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               _id:
     *                 type: string
     *               name:
     *                 type: string
     *     responses:
     *       200:
     *         description: Department updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Department'
     */
    router.post("/update-department", departmentController.updateDepartment)
};
