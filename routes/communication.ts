import express, { Router } from "express";
import { CommunicationController } from "../controllers";
import {
  communicationCreate,
  sendMailValidation,
  sendSMSValidation,
  validation,
  sendReplyMailValidation,
  uploadImageValidation,
} from "../middlewares/validations/communication";
import verifyToken from "../middlewares/auth";

const communicationController = new CommunicationController();
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Mass Communication:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the Mass Communication
 *         name:
 *           type: string
 *           description: The Mass Communication name
 */

/**
 * @swagger
 * tags:
 *   name: Mass Communication
 *   description: The Mass Communication managing API
 */
export default (router: Router) => {
  /**
   * @swagger
   * /communication:
   *   get:
   *     summary: Get list of communications
   *     tags: [Mass Communication]
   *     description: Retrieve a list of communications.
   *     responses:
   *       200:
   *         description: Successful response with list of communications
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Mass Communication'
   *       500:
   *         description: Internal server error
   */
  router.get("/communication", verifyToken, communicationController.list);

  router.post("/communication-list", communicationController.newList);

  /**
   * @swagger
   * /get-sender-email:
   *   get:
   *     summary: Get a email of sender
   *     tags: [Mass Communication]
   *     parameters:
   *       - in: query
   *         name: isSidePanel
   *         description: isSidePanel when one to one email
   *         required: false
   *         schema:
   *           type: string
   *     responses:
   *       '200':
   *         description: Get a email of sender
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Mass Communication'
   */
  router.get(
    "/get-sender-email",
    verifyToken,
    communicationController.getSenderEmail
  );
  /**
   * @swagger
   * /get-sender-phone:
   *   get:
   *     summary: Get a email of sender
   *     tags: [Mass Communication]
   *     responses:
   *       '200':
   *         description: Get a phone of sender
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Mass Communication'
   */
  router.get("/get-sender-phone", communicationController.getSenderPhone);

  /**
   * @swagger
   * /communication:
   *   post:
   *     summary: Create a new communication
   *     tags: [Mass Communication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description:
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Mass Communication'
   */
  router.post(
    "/communication",
    verifyToken,
    communicationCreate,
    validation,
    communicationController.create
  );
  router.post(
    "/communication-load-test",
    verifyToken,
    communicationCreate,
    validation,
    communicationController.loadTestCreate
  );

  /**
   * @swagger
   * /communication/{id}:
   *   get:
   *     summary: Get communication details by ID
   *     tags: [Mass Communication]
   *     description: Retrieve communication details by providing its ID.
   *     parameters:
   *       - in: path
   *         name: id
   *         description: ID of the communication to retrieve
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Successful response with communication details
   *       404:
   *         description: Communication not found
   *       500:
   *         description: Internal server error
   */
  router.get("/communication/:id", communicationController.getOnebyId);

  /**
   * @swagger
   * /communication/duplicate/{id}:
   *   post:
   *     summary: Duplicate a communication by ID
   *     tags: [Mass Communication]
   *     description: Create a duplicate of a communication by providing its ID.
   *     parameters:
   *       - in: path
   *         name: id
   *         description: ID of the communication to duplicate
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Successful duplication of communication
   *       400:
   *         description: Bad request, invalid ID or duplication failed
   *       500:
   *         description: Internal server error
   */
  router.post(
    "/communication/duplicate/:id",
    verifyToken,
    communicationController.duplicate
  );

  /**
   * @swagger
   * /communication/pin/{id}:
   *   post:
   *     summary: pin a communication by ID
   *     tags: [Mass Communication]
   *     description: Create a pin of a communication by providing its ID.
   *     parameters:
   *       - in: path
   *         name: id
   *         description: ID of the communication to pin
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Successful duplication of communication
   *       400:
   *         description: Bad request, invalid ID or duplication failed
   *       500:
   *         description: Internal server error
   */
  router.post("/communication/pin/:id", communicationController.pin);

  /**
   * @swagger
   * /communication/active/{id}:
   *   post:
   *     summary: active a communication by ID
   *     tags: [Mass Communication]
   *     description: Create a active of a communication by providing its ID.
   *     parameters:
   *       - in: path
   *         name: id
   *         description: ID of the communication to active
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Successful duplication of communication
   *       400:
   *         description: Bad request, invalid ID or duplication failed
   *       500:
   *         description: Internal server error
   */
  router.post(
    "/communication/active/:id",
    communicationController.activeInactive
  );

  /**
   * @swagger
   * /communication/change-status:
   *   post:
   *     summary: Change communication status
   *     tags: [Mass Communication]
   *     description: Update the status of a communication based on its ID.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               id:
   *                 type: string
   *                 description: ID of the communication to update
   *               status:
   *                 type: string
   *                 enum: [draft, pending_review, published, discarded, decline, restore, deleted]
   *                 description: New status to assign to the communication
   *     responses:
   *       200:
   *         description: Status change successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   description: Success message
   *     400:
   *       description: Bad request, invalid data provided
   *     404:
   *       description: Communication not found
   *     500:
   *       description: Internal server error
   */
  router.post(
    "/communication/change-status",
    verifyToken,
    communicationController.changeStatus
  );
  router.post(
    "/communication/patient-status-webhook",
    communicationController.patientStatusWebhook
  );

  /**
   * @swagger
   * /send-email:
   *   post:
   *     summary: Send Patient Email
   *     tags: [Mass Communication]
   *     description: Send patient email of a communication based on its ID.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               type:
   *                 type: string
   *                 description: Type set as email
   *               patient_id:
   *                 type: string
   *                 description: ID of the patient to send mail
   *               from:
   *                 type: string
   *                 description: From email address
   *               to:
   *                 type: string
   *                 description: To email address
   *               content:
   *                 type: string
   *                 description: Email inner body/content
   *               subject:
   *                 type: string
   *                 description: Subject of email address
   *               cc:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of email addresses to be cc
   *               bcc:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of email addresses to be bcc
   *             required:
   *               - type
   *               - patient_id
   *               - from
   *               - to
   *               - content
   *               - subject
   *     responses:
   *       200:
   *         description: Email sended successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   description: Success message
   *     400:
   *       description: Bad request, invalid data provided
   *     404:
   *       description: Patient not found
   *     500:
   *       description: Internal server error
   */
  router.post(
    "/send-email",
    verifyToken,
    sendMailValidation,
    validation,
    communicationController.sendContent
  );
  router.post(
    "/update-hashtag",
    verifyToken,
    validation,
    communicationController.updateHashtags
  );

  /**
   * @swagger
   * /send-sms:
   *   post:
   *     summary: Send Patient SMS
   *     tags: [Mass Communication]
   *     description: Send patient sms of a communication based on its ID.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               type:
   *                 type: string
   *                 description: Type set as sms
   *               patient_id:
   *                 type: string
   *                 description: ID of the patient to send mail
   *               to:
   *                 type: string
   *                 description: To as mobile numbers
   *               content:
   *                 type: string
   *                 description: SMS inner body/content
   *             required:
   *               - type
   *               - patient_id
   *               - to
   *               - content
   *     responses:
   *       200:
   *         description: SMS sended successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   description: Success message
   *     400:
   *       description: Bad request, invalid data provided
   *     404:
   *       description: Patient not found
   *     500:
   *       description: Internal server error
   */
  router.post(
    "/send-sms",
    verifyToken,
    sendSMSValidation,
    validation,
    communicationController.sendContent
  );
  router.post(
    "/send-test-sms",
    verifyToken,
    communicationController.sendTestContent
  );

  /**
   * @swagger
   * /reply-email:
   *   post:
   *     summary: Send Patient Reply Email
   *     tags: [Mass Communication]
   *     description: Send patient email of a communication based on its ID and parent Id.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               type:
   *                 type: string
   *                 description: Type set as email
   *               com_history_id:
   *                 type: string
   *                 description: Parent ID of the communication to send reply mail
   *               content:
   *                 type: string
   *                 description: Email inner body/content
   *               cc:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of email addresses to be cc
   *               bcc:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of email addresses to be bcc
   *             required:
   *               - type
   *               - patient_id
   *               - com_history_id
   *               - content
   *     responses:
   *       200:
   *         description: Reply email sended successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   description: Success message
   *     400:
   *       description: Bad request, invalid data provided
   *     404:
   *       description: Patient not found
   *     500:
   *       description: Internal server error
   */
  router.post(
    "/reply-email",
    verifyToken,
    sendReplyMailValidation,
    validation,
    communicationController.sendContent
  );
  router.post(
    "/upload-image",
    verifyToken,
    uploadImageValidation,
    validation,
    communicationController.uploadImage
  );
  router.get("/test-api", verifyToken, communicationController.testApi);
  router.post(
    "/test-tiny-mce",
    verifyToken,
    communicationController.testTinyMce
  );
};
