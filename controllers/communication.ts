import { Request, Response } from "express";
import _ from "lodash";
import moment from "moment";
import moment_timezone from "moment-timezone";
import { CommunicationService, ProcessCommunicationService, UserTokenService, SettingService } from "../service";
import { CommonUtils } from "../utils";
import * as Types from "../types/communication";
import { UserRequest, UpdateCommunicationRequest } from "../types/request";
import he from "he";
import { Types as mongoTypes } from "mongoose";
import { buildNotifications } from "../service/buildNotifications";
import dotenv from "dotenv";

/**
 * Controller class for managing communication-related operations.
 * It integrates communication services, process communication services,
 * and common utilities to handle various communication tasks.
 */
export class CommunicationController {
  /**
   * @type {CommunicationService}
   * @private
   */
  private communicationService: CommunicationService;
  /**
   * @type {ProcessCommunicationService}
   * @private
   */
  private processCommunicationService: ProcessCommunicationService;
  /**
   * @type {CommonUtils}
   * @private
   */
  private commonUtils: CommonUtils;

  /**
   * @type {UserTokenService}
   * @private
   */
  private userTokenService: UserTokenService;
  /**
   * @type {SettingService}
   * @private
   */
  private settingService: SettingService;

  /**
   * Initializes a new instance of the CommunicationController class.
   * Sets up the communication service, process communication service,
   * and common utilities required for communication operations.
   * @constructor
   */
  constructor() {
    this.communicationService = new CommunicationService();
    this.processCommunicationService = new ProcessCommunicationService();
    this.commonUtils = CommonUtils.getInstance();
    this.userTokenService = new UserTokenService();
    this.settingService = new SettingService();
  }

  /**
   * Handles listing communication scripts with pagination, filtering, and search functionality.
   *
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
   * @returns {Promise<Response>} - Returns a JSON response with status, data, and pagination information.
   *
   * @async
   * @function - list
   */
  list = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { PageNo, Status: STATUS, SearchString } = req.query;

      // pagination
      const { PAGE_LIMIT } = process.env;
      const LIMIT = parseInt(PAGE_LIMIT ?? "20"); // Maximum number of items per page
      const PAGE = parseInt(PageNo as string) ?? 1; // Current page number
      const SKIP = PAGE ? (PAGE - 1) * LIMIT : 0; // Number of items to skip for pagination
      const condition: any = {}; // Conditions for filtering scripts
      if (!_.isEmpty(STATUS)) {
        condition.status = { $ne: "deleted", $eq: STATUS }; // Filtering by status
      }

      // Handling search functionality
      if (SearchString) {
        condition["$or"] = [
          { type: { $regex: SearchString, $options: "i" } },
          { token: { $regex: SearchString, $options: "i" } },
          { title: { $regex: SearchString, $options: "i" } },
          { "department.name": { $regex: SearchString, $options: "i" } },
        ];
      }

      // Retrieving script data with pagination and filtering
      let communicationData = await this.communicationService.list(SKIP, LIMIT, condition);

      const TOTAL_COUNT: number = !_.isEmpty(communicationData[0]?.total) ? communicationData[0]?.total[0]?.count : 0;

      // Generating pagination data
      const pagination = await this.commonUtils.pagination(TOTAL_COUNT, PAGE, LIMIT);
      // Returning response script data
      return res.status(200).json({
        status: true,
        data: communicationData[0]?.data ?? [],
        pagination: pagination,
      });
    } catch (error: any) {
      // Logging error message
      console.log("communication/list -->", error?.message);
      // Returning error response
      return res.status(400).json({
        status: false,
        message: error?.message,
      });
    }
  };

  /**
   * Handles the creation or update of a communication record.
   *
   * @async
   * @param {UserRequest} req - The request object, containing user and communication data.
   * @param {Response} res - The response object, used to send the response back to the client.
   * @returns {Promise<Response>} - The response object with the status and message of the operation.
   *
   * @description
   * This function manages the creation and update operations for communication records.
   * It first checks the status of the communication and validates it if necessary.
   * Depending on whether an ID is present in the request body, it either updates an existing record or creates a new one.
   * The function also handles various data modifications and validation checks before saving the record.
   * If an error occurs during the process, it logs the error and returns a response with the error message.
   */
  create = async (req: UserRequest, res: Response): Promise<Response> => {
    try {
      const { discarded, draft } = Types.CommunicationStatus;
      if (req.body?.status && ![discarded, draft].includes(req.body.status)) {
        let isValidated = await this.validateCommunication(req.body);

        if (!isValidated.status) {
          return res.status(200).json({
            status: isValidated.status,
            message: isValidated.message,
          });
        }
      }

      let data: Types.CommunicationResponse | null;
      let message: string;

      if (req.body?.id) {
        const { id, ...communicationData } = req.body;

        const oldComData: any = await this.communicationService.findOneById(id);
        console.log("oldComData", oldComData);

        if (!oldComData) {
          console.log("oldComData", oldComData);
          return res.status(400).json({
            status: false,
            message: "Invalid request.",
          });
        }

        if (oldComData.type != communicationData.type) {
          communicationData.token = await this.communicationService.generateToken(communicationData.type);
        }

        communicationData.updated_by = req?.user?.Email;
        communicationData.is_pinned = false;
        communicationData.pin_order_time = null;
        communicationData.updated_on = moment().toDate();

        data = await this.communicationService.updateOne(id, communicationData);
        console.log("data", data);
        message = "Communication successfully updated";
      } else {
        const body = req.body;
        body.created_by = req?.user?.Email;
        body.created_username = req?.user?.FirstName + " " + req?.user?.LastName;
        body.token = await this.communicationService.generateToken(body.type);
        data = await this.communicationService.createOne(body);
        message = "Communication successfully created";
      }

      // Check if data is empty (indicating invalid request) and respond accordingly.
      if (_.isEmpty(data)) {
        return res.status(400).json({
          status: false,
          message: "Invalid request.",
        });
      }
      if (req.body.is_requested) {
        let notificationData: any = {};
        const username = req?.user?.FirstName + " " + req?.user?.LastName;
        let distro_email = await this.commonUtils.getSecret(`${process.env.NODE_ENV ?? "local"}-PATIENT-ENGAGEMENT-DISTRO`);
        notificationData.title = `${username} has requested a script for a mass communication. Please Review.`;
        notificationData.content = `${username} has requested a script for a mass communication. Please Review.`;
        notificationData.distro_email = distro_email;
        notificationData.recruiter_email = null;
        notificationData.type = 'request_script';
        notificationData.communication_type = 'request_script';
        this.communicationService.sendNotification(notificationData);
      }
      this.communicationService.processHashtags(data._id, data.hashtag);
      return res.status(200).json({
        status: true,
        message: message,
      });
    } catch (error: any) {
      // Log the error message
      console.log("communication/create -->", error?.message);
      // Respond with the error message.
      return res.status(400).json({
        status: false,
        message: error?.message,
      });
    }
  };

  loadTestCreate = async (req: UserRequest, res: Response): Promise<Response> => {
    try {
      const token = req.headers["authorization"]?.split(" ")[1];

      if (!token) {
        return res.status(401).json({ error: "No token provided" });
      }

      const { discarded, draft } = Types.CommunicationStatus;
      if (req.body?.status && ![discarded, draft].includes(req.body.status)) {
        let isValidated = await this.validateCommunication(req.body);

        if (!isValidated.status) {
          return res.status(200).json({
            status: isValidated.status,
            message: isValidated.message,
          });
        }
      }

      let data: any;
      const body = req.body;
      body.created_by = req?.user?.Email;
      body.created_username = req?.user?.FirstName + " " + req?.user?.LastName;
      body.token = await this.communicationService.generateToken(body.type);
      data = await this.communicationService.createOne(body);
      data = data.toObject();

      // Check if data is empty (indicating invalid request) and respond accordingly.
      if (_.isEmpty(data)) {
        return res.status(400).json({
          status: false,
          message: "Invalid request.",
        });
      }

      this.communicationService.processHashtags(data._id, data.hashtag);
      const newBody: Types.CommunicationChangeStatus = { id: data._id, status: Types.CommunicationStatus.published, user: req.user?.Email, created_username: req?.user?.FirstName + " " + req?.user?.LastName };

      const communication = await this.communicationService.changeStatus(data, newBody, token);
      console.log("🚀 ~ CommunicationController ~ loadTestCreate= ~ communication:", communication)
      if (_.isEmpty(communication)) {
        return res.status(400).json({
          status: false,
          message: "Invalid request.",
        });
      }

      await this.processCommunicationService.TestprocessCommunication(communication);

      return res.status(200).json({
        status: true,
        message: 'MassCom Added',
      });

    } catch (error: any) {
      // Log the error message
      console.log("communication/create -->", error?.message);
      // Respond with the error message.
      return res.status(400).json({
        status: false,
        message: error?.message,
      });
    }
  };

  updateHashtags = async (req: Request, res: Response): Promise<Response> => {
    this.communicationService.processHashtags(req.body.id, req.body.hashtag, "mass-com");
    return res.status(200).json({
      status: true,
      message: "Hashtags updated successfully",
    });
  };

  /**
   * Duplicates an existing communication, setting its status to 'draft', and saves it as a new communication.
   *
   * @async
   * @function - duplicate
   * @param {UpdateCommunicationRequest} req - The request object, containing the communication ID in params and user email in the user object.
   * @param {Response} res - The response object used to return the status and result of the operation.
   * @returns {Promise<Response>} - A promise that resolves to the response object with the status and result of the operation.
   *
   * @description This function retrieves an existing communication by its ID, modifies its status to 'draft', and creates a new communication with the same properties but with a different title. If the communication is not found, it returns a 400 status with an error message. Upon successful duplication, it returns a 200 status with a success message.
   *
   * @throws {Error} If an error occurs during the process, it logs the error and returns a 400 status with the error message.
   */
  duplicate = async (req: UpdateCommunicationRequest, res: Response): Promise<Response> => {
    try {
      // Retrieve the communication from the repository based on the provided ID.
      let communication = await this.communicationService.findOneById(req.params.id);

      if (_.isEmpty(communication)) {
        return res.status(400).json({
          status: false,
          message: "Invalid request.",
        });
      }

      let data: Types.CommunicationData = {
        title: "Copy of " + communication.title,
        type: communication.type,
        department_id: communication.department_id,
        hashtag: communication?.hashtag,
        status: Types.CommunicationStatus.draft,
        description: communication.description,
        is_pinned: false,
        referral_source: communication.referral_source,
        study: communication.study,
        sender_config: communication.sender_config,
        frequency: communication.frequency,
        frequency_config: communication.frequency_config,
        script_id: communication.script_id,
        script_content: communication.script_content,
        media: communication?.media || null,
        is_active: true,
        inclusion: communication?.inclusion || null,
        exclusion: communication?.exclusion || null,
        created_by: req?.user?.Email,
        updated_by: req?.user?.Email,
        timezone: communication.timezone,
        filtered_count: communication?.filtered_count ?? 0,
      };

      // Modify the status of the retrieved communication to 'draft'.
      // Create a new communication with the modified data.
      let token = await this.communicationService.generateToken(data.type as string);

      if (typeof token === 'string') {
        data.token = token
      }

      let duplicateData = await this.communicationService.createOne(data);

      // Respond with success status and the duplicated communication data.
      return res.status(200).json({
        status: true,
        data: duplicateData,
        message: "Duplicate communication has been saved in draft",
      });
    } catch (error: any) {
      // Log and respond with error message
      console.log("communication/duplicate --> ", error?.message);
      return res.status(400).json({
        status: false,
        message: error?.message,
      });
    }
  };

  /**
   * Pins a script based on the provided ID.
   *
   * This function handles an asynchronous request to pin a script using the provided ID. It interacts with the `communicationService` to perform the pinning operation and returns an appropriate HTTP response based on the outcome.
   *
   * @async
   * @function - pin
   * @param {Request<{ id: string }>} req - The request object, containing the script ID in the URL parameters.
   * @param {Response} res - The response object used to send back the desired HTTP response.
   * @returns {Promise<Response>} - A promise that resolves to the HTTP response.
   */
  pin = async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
    try {
      // Retrieve the script from the repository based on the provided ID.
      let response = await this.communicationService.pin(req.params.id);

      if (_.isEmpty(response)) {
        return res.status(400).json({
          status: false,
          message: "Invalid request.",
        });
      }

      return res.status(200).json({
        status: response.status,
        message: response.message,
      });
    } catch (error: any) {
      // Log and respond with error message
      console.log("communication/duplicate --> ", error?.message);
      return res.status(400).json({
        status: false,
        message: error?.message,
      });
    }
  };

  /**
   * Toggles the active/inactive status of a communication based on the provided ID.
   *
   * @async
   * @function - activeInactive
   * @param {Request<{ id: string }>} req - The request object, containing the ID parameter in the URL.
   * @param {Response} res - The response object, used to send back the appropriate HTTP response.
   * @returns {Promise<Response>} A promise that resolves to an HTTP response indicating the result of the operation.
   *
   * @description
   * This endpoint is designed to update the status of a communication record. The ID of the communication
   * is provided as a URL parameter. The method attempts to toggle the status (active/inactive) of the
   * specified communication by interacting with the communicationService. If the communication with the
   * given ID is found and updated successfully, a success response is returned. If the communication is not found
   * or any error occurs, an appropriate error response is returned.
   */
  activeInactive = async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
    try {
      // Retrieve the communication from the repository based on the provided ID.
      let communication = await this.communicationService.activeInactive(req.params.id);

      if (_.isEmpty(communication)) {
        return res.status(200).json({
          status: false,
          message: "Invalid request.",
        });
      }

      return res.status(200).json({
        status: true,
        message: "Communication updated successfully",
      });
    } catch (error: any) {
      // Log and respond with error message
      console.log("communication/activeInactive --> ", error?.message);
      return res.status(400).json({
        status: false,
        message: error?.message,
      });
    }
  };

  /**
   * Changes the status of a communication based on the provided request.
   *
   * @async
   * @function - changeStatus
   * @param {UserRequest} req - The request object, containing headers and body.
   * @param {Response} res - The response object used to send the response.
   * @returns {Promise<Response>} - A promise that resolves to a response object.
   */
  changeStatus = async (req: UserRequest, res: Response): Promise<Response> => {
    try {
      const token = req.headers["authorization"]?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ error: "No token provided" });
      }
      const body = req.body;
      body.user = req.user?.Email;
      body.created_username = req?.user?.FirstName + " " + req?.user?.LastName;
      let communication = await this.communicationService.findOneById(body.id);

      if (_.isEmpty(communication)) {
        return res.status(400).json({
          status: false,
          message: "Invalid request.",
        });
      }

      const { pending_review, published } = Types.CommunicationStatus;
      if ([pending_review, published].includes(body.status)) {
        let isValidated = await this.validateCommunication(communication);

        if (!isValidated.status) {
          return res.status(200).json({
            status: isValidated.status,
            message: isValidated.message,
          });
        }
      }
      communication = await this.communicationService.changeStatus(communication, body, token);

      if (_.isEmpty(communication)) {
        return res.status(400).json({
          status: false,
          message: "Invalid request.",
        });
      }

      if(body?.media && !_.isEmpty(body?.media)){
        communication.media = body?.media;
      }
      // Call processCommunication to decide immediate or scheduled processing
      await this.processCommunicationService.processCommunication(communication);

      let communicationStatus: string = communication.status ?? "";
      switch (communication.status) {
        case "draft":
          communicationStatus = "Draft";
          break;
        case "pending_review":
          communicationStatus = "Pending Review";
          break;
        case "published":
          communicationStatus = "Published";
          break;
        case "deleted":
          communicationStatus = "Communication permanently deleted";
          break;
        case "discarded":
          communicationStatus = "Discarded";
          break;
      }

      return res.status(200).json({
        status: true,
        message: communication.status == "deleted" ? communicationStatus : `Communication status has been updated to ${communicationStatus}.`,
      });
    } catch (error: any) {
      // Log and respond with error message
      console.log("communication/changeStatus --> ", error?.message);
      return res.status(400).json({
        status: false,
        message: error?.message,
      });
    }
  };

  /**
   * Retrieves a communication record by its ID.
   *
   * @async
   * @function - getOnebyId
   * @param {Request} req - The request object, containing the ID of the communication record in the parameters.
   * @param {Response} res - The response object used to send back the appropriate HTTP response.
   * @returns {Promise<Response>} - A promise that resolves to the response object.
   *
   * @description
   * This asynchronous function handles HTTP GET requests to retrieve a communication record by its ID.
   * It uses the `communicationService` to find the record. If the record is found, it returns a JSON
   * response with a status of `true` and the record data. If the record is not found, it returns a
   * JSON response with a status of `false` and an "Invalid request" message. In case of an error during
   * the process, it catches the error, logs it, and responds with a status of `false` and the error message.
   * @throws - Will return a 400 status code with an error message if the retrieval process encounters an error.
   */
  getOnebyId = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      // Retrieve the script from the repository based on the provided ID.
      let communication = await this.communicationService.findOneById(id);

      if (_.isEmpty(communication)) {
        return res.status(400).json({
          status: false,
          message: "Invalid request.",
        });
      }

      return res.status(200).json({
        status: true,
        data: communication,
      });
    } catch (error: any) {
      // Log and respond with error message
      console.log("communication/activeInactive --> ", error?.message);
      return res.status(400).json({
        status: false,
        message: error?.message,
      });
    }
  };

  /**
   * Handles webhook requests related to patient status updates.
   *
   * @async
   * @function - patientStatusWebhook
   * @param {Request} req - Express Request object containing the webhook payload.
   * @param {Response} res - Express Response object for sending the response.
   * @returns {Promise<Response>} - Promise resolving to the HTTP response.
   */
  patientStatusWebhook = async (req: Request, res: Response): Promise<Response> => {
    try {
      await this.processCommunicationService.patientStatusWebhook(req.body);
      return res.status(200).json({
        status: true,
        message: "Success",
      });
    } catch (error: any) {
      // Log and respond with error message
      console.log("communication/patientStatusWebhook --> ", error?.message);
      return res.status(400).json({
        status: false,
        message: error?.message,
      });
    }
  };

  /**
   * Retrieves the sender's email asynchronously.
   *
   * @async
   * @function - getSenderEmail
   * @param {UserRequest} req The request object.
   * @param {Response} res The response object.
   * @returns {Promise<Response>} A Promise resolving to the response object.
   */
  getSenderEmail = async (req: UserRequest, res: Response): Promise<Response> => {
    try {
      let loginUserEmail = req.user?.Email;
      let loginUserName = req?.user?.FirstName + " " + req?.user?.LastName;;
      let { isSidePanel } = req.query;

      let sidePanelSenderEmail: any = [];
      let userTokenExists: any = false;
      if (isSidePanel) {
        // check in usertoken setup list
        userTokenExists = await this.userTokenService.findOneByEmail(loginUserEmail);
        //login user and login user's distro
        if (userTokenExists) {
          sidePanelSenderEmail.push({
            "email": loginUserEmail,
            "name": loginUserName,
            "connected": true
          });
        }
      }
      // distro of that login user
      // get distro/group data from cache
      let distroCacheData = (await this.commonUtils.getCache(`distroGroup`)) || [];
      for (let dist of distroCacheData) {
        if (dist.members.includes(loginUserEmail)) {
          let temp = {
            "email": dist.group_email,
            "name": dist.group_name,
            "connected": true
          };
          sidePanelSenderEmail.push(temp);
        }
      }
      return res.status(200).json({
        status: true,
        data: sidePanelSenderEmail,
      });
    } catch (error: any) {
      // Log and respond with error message
      return res.status(400).json({
        status: false,
        message: error?.message,
      });
    }
  };

  /**
   * Asynchronously retrieves the sender's phone number from the commonUtils service.
   * If the sender's phone number is not found or the request is invalid, responds with a 400 status.
   * Otherwise, responds with a 200 status and the sender's phone number.
   *
   * @param {Request} req - The Express request object.
   * @param {Response} res - The Express response object.
   * @returns {Promise<Response>} - A Promise that resolves to the Express response object.
   *
   * @async
   * @function getSenderPhone
   */
  getSenderPhone = async (req: Request, res: Response): Promise<Response> => {
    try {
      let senderEmail = await this.settingService.getSenderActivePhone();

      // if (_.isEmpty(senderEmail)) {
      //   return res.status(400).json({
      //     status: false,
      //     message: "Invalid request.",
      //   });
      // }

      return res.status(200).json({
        status: true,
        data: senderEmail || [],
      });
    } catch (error: any) {
      // Log and respond with error message
      return res.status(400).json({
        status: false,
        message: error?.message,
      });
    }
  };

  /**
   * Validates the communication data.
   * @async
   * @function - validateCommunication
   * @param {CommunicationData} body - The communication data to validate.
   * @returns {Promise<CommunicationValidationResponse>} The validation result.
   */
  validateCommunication = async (body: Types.CommunicationData): Promise<Types.CommunicationValidationResponse> => {
    if (!body?.type) {
      return {
        status: false,
        message: "Communication type is required.",
      };
    }

    if (!body?.frequency) {
      return {
        status: false,
        message: "Frequency is required.",
      };
    }

    if (_.isEmpty(body.sender_config)) {
      return {
        status: false,
        message: "Sender config is required.",
      };
    }

    let validateSenderConfig = await this.validateSenderConfig(body.type, body.sender_config);
    if (!validateSenderConfig.status) {
      return validateSenderConfig;
    }

    if (_.isEmpty(body.frequency_config)) {
      return {
        status: false,
        message: "Frequency config is required.",
      };
    }

    let validateFrequencyType = await this.validateFrequencyType(body.frequency, body.frequency_config.type);
    if (!validateFrequencyType.status) {
      return validateFrequencyType;
    }

    let validateOnetimeFrequency = await this.validateOnetimeFrequency(body.frequency, body.frequency_config, body?.timezone);
    if (!validateOnetimeFrequency.status) {
      return validateOnetimeFrequency;
    }

    let validateRepeatFrequency = await this.validateRecurring(body.frequency, body.frequency_config, body?.timezone);
    if (!validateRepeatFrequency.status) {
      return {
        status: false,
        message: validateRepeatFrequency.message,
      };
    }

    return {
      status: true,
    };
  };

  /**
   * Validates the recurring communication configuration.
   *
   * This function performs a series of validations to ensure that the recurring communication configuration is correct.
   * It checks the repeat frequency, the repeat until date, and any delays that may be specified in the configuration.
   * If any of these validations fail, it returns a failure response with the corresponding message.
   *
   * @async
   * @param {Types.FrequencyType} frequency - The frequency type of the communication. Should be 'recurring' for this validation to proceed.
   * @param {Types.FrequencyConfig} frequency_config - The configuration object for the frequency settings.
   * @param {string} timezone - The timezone in which the communication is scheduled.
   * @returns {Promise<Types.CommunicationValidationResponse>} - A promise that resolves to a validation response object.
   * @throws {Error} - If there is an error during the validation process, an error message is logged and a failure response is returned.
   */
  validateRecurring = async (
    frequency: Types.FrequencyType,
    frequency_config: Types.FrequencyConfig,
    timezone: string
  ): Promise<Types.CommunicationValidationResponse> => {
    try {
      if (frequency != Types.FrequencyType.recurring) {
        return {
          status: true,
        };
      }

      let validateRepeatFrequency = await this.validateRepeatFrequency(frequency_config, timezone);
      if (!validateRepeatFrequency.status) {
        return {
          status: false,
          message: validateRepeatFrequency.message,
        };
      }

      let validateRepeatUntil = await this.validateRepeatUntil(frequency_config, timezone);
      if (!validateRepeatUntil.status) {
        return {
          status: false,
          message: validateRepeatUntil.message,
        };
      }

      let validateDelay = await this.validateDelay(frequency_config);
      if (!validateDelay.status) {
        return {
          status: false,
          message: validateDelay.message,
        };
      }

      return {
        status: true,
      };
    } catch (error: any) {
      console.log("communication/validateRecurring --> ", error?.message);
      return {
        status: false,
        message: "Something went wrong.",
      };
    }
  };

  /**
   * Validates the sender configuration for a given communication type.
   * @async
   * @function - validateSenderConfig
   * @param {Types.CommunicationType} type - The type of communication (e.g., "sms", "email").
   * @param {Types.SenderConfig} sender_config - The sender configuration object containing sender details.
   * @returns {Promise<Types.CommunicationValidationResponse>} A promise that resolves to a communication validation response.
   * @throws {Error} Throws an error if an unexpected error occurs during validation.
   * @description This function validates the sender configuration based on the communication type.
   * For SMS communication, it checks if the sender phone is provided. For email communication,
   * it delegates validation to the `validateEmailFields` method. Returns a communication validation
   * response object indicating whether the configuration is valid or not.
   */
  validateSenderConfig = async (type: Types.CommunicationType, sender_config: Types.SenderConfig): Promise<Types.CommunicationValidationResponse> => {
    try {
      if (type == "sms" && _.isEmpty(sender_config?.sender_phone)) {
        return {
          status: false,
          message: "Sender Phone is required.",
        };
      }

      if (type == "email") {
        return await this.validateEmailFields(sender_config);
      }

      return {
        status: true,
      };
    } catch (error: any) {
      console.log("communication/validateSenderConfig --> ", error?.message);
      return {
        status: false,
        message: "Something went wrong.",
      };
    }
  };

  /**
   * Validates the frequency type and configuration type for communication.
   * @async
   * @function - validateFrequencyType
   * @param {Types.FrequencyType} frequency_type - The type of frequency (one_time or recurring).
   * @param {Types.FrequencyConfigType} frequency_config_type - The configuration type for the frequency.
   * @returns {Promise<Types.CommunicationValidationResponse>} The validation response indicating if the types are valid.
   * @throws {Error} Throws an error if something goes wrong during validation.
   */
  validateFrequencyType = async (
    frequency_type: Types.FrequencyType,
    frequency_config_type: Types.FrequencyConfigType
  ): Promise<Types.CommunicationValidationResponse> => {
    try {
      const { one_time, recurring } = Types.FrequencyType;
      const { now, scheduled, status_change, study_visit } = Types.FrequencyConfigType;
      if (frequency_type == one_time && ![now, scheduled].includes(frequency_config_type)) {
        return {
          status: false,
          message: `Type must be one of the following ['${now}', '${scheduled}'].`,
        };
      }

      if (frequency_type == recurring && ![status_change, study_visit].includes(frequency_config_type)) {
        return {
          status: false,
          message: `Trigger Type must be one of the following ['${status_change}', '${study_visit}'].`,
        };
      }
      return {
        status: true,
      };
    } catch (error: any) {
      console.log("communication/validateFrequencyType --> ", error?.message);
      return {
        status: false,
        message: "Something went wrong.",
      };
    }
  };

  /**
   * Validates a one-time communication frequency configuration based on scheduled time.
   * @async
   * @function - validateOnetimeFrequency
   * @param {Types.FrequencyConfig} frequency_config - The frequency configuration object.
   * @param {string} timezone - The timezone to be used for validation.
   * @returns {Promise<Types.CommunicationValidationResponse>} A promise resolving to a validation response indicating the status and, if applicable, an error message.
   * @description This function validates a one-time communication frequency configuration, ensuring that for scheduled communications, the scheduled time is provided and is a valid datetime greater than the current datetime in the specified timezone.
   */
  validateOnetimeFrequency = async (
    frequency: Types.FrequencyType,
    frequency_config: Types.FrequencyConfig,
    timezone: string
  ): Promise<Types.CommunicationValidationResponse> => {
    try {
      if (frequency != Types.FrequencyType.one_time) {
        return {
          status: true,
        };
      }

      if (frequency_config.type != Types.FrequencyConfigType.scheduled) {
        return {
          status: true,
        };
      }

      if (_.isEmpty(frequency_config?.scheduled_time)) {
        return {
          status: false,
          message: "Scheduled time is required.",
        };
      }

      if (!(await this.validateDatetime(frequency_config?.scheduled_time, timezone))) {
        return {
          status: false,
          message: "Scheduled time must be a datetime and greater than current datetime.",
        };
      }

      return {
        status: true,
      };
    } catch (error: any) {
      console.log("communication/validateOnetimeFrequency --> ", error?.message);
      return {
        status: false,
        message: "Something went wrong.",
      };
    }
  };

  /**
   * Validates the repeat frequency configuration for communication.
   * @async
   * @param {Types.FrequencyConfig} frequency_config - The frequency configuration object.
   * @param {string} timezone - The timezone in which the validation is performed.
   * @returns {Promise<Types.CommunicationValidationResponse>} A promise that resolves to a CommunicationValidationResponse object indicating the validation status and message.
   * @throws {Error} If an unexpected error occurs during validation.
   */
  validateRepeatFrequency = async (frequency_config: Types.FrequencyConfig, timezone: string): Promise<Types.CommunicationValidationResponse> => {
    try {
      const { study_visit } = Types.FrequencyConfigType;
      if (frequency_config.type == study_visit) {
        let validateResponse = await this.validateRepeatFrequencyStudyVisit(frequency_config, timezone);

        if (!validateResponse.status) {
          return {
            status: validateResponse.status,
            message: validateResponse?.message,
          };
        }
      }

      if (frequency_config?.interval?.interval_schedule_type == Types.IntervalScheduleType.hours) {
        return {
          status: true,
        };
      }

      if (_.isEmpty(frequency_config?.repeat_frequency)) {
        return {
          status: false,
          message: "Repeat Frequency is required.",
        };
      }

      if (!frequency_config.repeat_frequency?.type) {
        return {
          status: false,
          message: "Repeat Frequency Type is required.",
        };
      }

      const { daily, weekly, monthly, immediate } = Types.RepeatFrequencyType;
      if (![daily, monthly, weekly, immediate].includes(frequency_config.repeat_frequency?.type)) {
        return {
          status: false,
          message: `Repeat Frequency Type must be one of the following ['${daily}', '${weekly}', '${monthly}', '${immediate}'].`,
        };
      }

      if(frequency_config?.repeat_frequency?.type == Types.RepeatFrequencyType.immediate){
        return {
          status: true,
        };
      }

      if (_.isEmpty(frequency_config.repeat_frequency?.schedule_time)) {
        return {
          status: false,
          message: "Repeat Frequency Schedule Time is required.",
        };
      }

      if (
        !Array.isArray(frequency_config.repeat_frequency.schedule_time) ||
        !frequency_config.repeat_frequency.schedule_time.every((item) => typeof item === "object")
      ) {
        return {
          status: false,
          message: "Repeat Frequency Schedule Time must be an array of objects.",
        };
      }

      if (frequency_config.repeat_frequency.type == daily) {
        return await this.validateRepeatFrequencyDaily(frequency_config.repeat_frequency.schedule_time);
      }

      if (frequency_config.repeat_frequency.type == weekly) {
        return await this.validateRepeatFrequencyWeekly(frequency_config.repeat_frequency.schedule_time);
      }

      if (frequency_config.repeat_frequency.type == monthly) {
        return await this.validateRepeatFrequencyMonthly(frequency_config.repeat_frequency.schedule_time, timezone);
      }

      return {
        status: true,
      };
    } catch (error: any) {
      console.log("communication/validateRepeatFrequency --> ", error?.message);
      return {
        status: false,
        message: "Something went wrong.",
      };
    }
  };

  /**
   * Validates repeat until condition for communication frequency configurations.
   * This function handles validation for different types of frequency configurations.
   *
   * @param {Types.FrequencyConfig} frequency_config - The frequency configuration to validate.
   * @param {string} timezone - The timezone to consider for validation.
   * @returns {Promise<Types.CommunicationValidationResponse>} A Promise resolving to the validation response.
   */
  validateRepeatUntil = async (frequency_config: Types.FrequencyConfig, timezone: string): Promise<Types.CommunicationValidationResponse> => {
    try {
      const { status_change, study_visit } = Types.FrequencyConfigType;

      if (frequency_config.type == status_change) {
        return await this.validateRepeatUntilStatusChange(frequency_config, timezone);
      }

      if (frequency_config.type == study_visit) {
        return await this.validateRepeatUntilStudyVisit(frequency_config);
      }

      return {
        status: true,
      };
    } catch (error: any) {
      console.log("communication/validateRepeatUntil --> ", error?.message);
      return {
        status: false,
        message: "Something went wrong.",
      };
    }
  };

  /**
   * Validates the delay configuration for communication frequency.
   * @async
   * @function validateDelay
   * @param {Types.FrequencyConfig} frequency_config - The configuration object containing frequency settings.
   * @returns {Promise<Types.CommunicationValidationResponse>} A promise resolving to a validation response.
   * @throws {Error} If an unexpected error occurs during validation.
   */
  validateDelay = async (frequency_config: Types.FrequencyConfig): Promise<Types.CommunicationValidationResponse> => {
    try {
      if (!_.isEmpty(frequency_config?.delay)) {
        if (!frequency_config.delay?.type) {
          return {
            status: false,
            message: "Delay Type is required.",
          };
        }

        const { days, hours, minutes } = Types.DelayType;
        if (![days, hours, minutes].includes(frequency_config.delay.type)) {
          return {
            status: false,
            message: `Delay Type must be one of the following ['${days}', '${hours}', '${minutes}'].`,
          };
        }

        if (!frequency_config.delay?.duration || !Number.isInteger(parseInt(frequency_config.delay?.duration))) {
          return {
            status: false,
            message: "Delay Duration is required and must be a number.",
          };
        }
      }
      return {
        status: true,
      };
    } catch (error: any) {
      console.log("communication/validateDelay --> ", error?.message);
      return {
        status: false,
        message: "Something went wrong.",
      };
    }
  };

  /**
   * Validates a datetime against certain criteria, such as timezone, whether it should be greater than the current datetime, and a specific format.
   * @async
   * @param {Date} [datetime] - The datetime to validate.
   * @param {string} [timezone="America/Chicago"] - The timezone in which the datetime should be interpreted. Defaults to "America/Chicago".
   * @param {boolean} [checkGreater=true] - If true, checks if the provided datetime is greater than the current datetime. Defaults to true.
   * @param {string} [format="YYYY-MM-DDTHH:mm:ss"] - The format string for the datetime. Defaults to "YYYY-MM-DDTHH:mm:ss".
   * @returns {Promise<boolean | Types.CommunicationValidationResponse>} - A Promise that resolves to true if the datetime is valid or false otherwise. If an error occurs, it returns a communication validation response object with status false and a message indicating the error.
   */
  validateDatetime = async (
    datetime?: Date,
    timezone: string = "America/Chicago",
    checkGreater: boolean = true,
    format: string = "YYYY-MM-DDTHH:mm:ss"
  ): Promise<boolean | Types.CommunicationValidationResponse> => {
    console.log("MASS COMM: validateDatetime: ", "datetime => ", datetime);
    console.log("MASS COMM: validateDatetime: ", "checkGreater => ", checkGreater);
    console.log("MASS COMM: validateDatetime: ", "format => ", format);
    try {
      const datetimeMoment = moment_timezone.tz(datetime, timezone).utc();
      console.log("MASS COMM: validateDatetime: ", "datetimeMoment => ", datetimeMoment);
      if (!datetimeMoment.isValid()) {
        return false;
      }
      if (checkGreater) {
        const currentDatetime = moment();
        console.log("MASS COMM: validateDatetime: ", "currentDatetime => ", currentDatetime);
        currentDatetime.subtract(60, "seconds");
        if (!datetimeMoment.isSameOrAfter(currentDatetime)) {
          return false;
        }
      }

      return true;
    } catch (error: any) {
      console.log("communication/validateDatetime --> ", error?.message);
      return {
        status: false,
        message: "Something went wrong.",
      };
    }
  };

  /**
   * Validates an array of schedule times to ensure they are valid and contain no duplicates.
   * @async
   * @param {string[]} times - An array of strings representing schedule times in the format "HH:MM AM/PM".
   * @returns {Promise<Types.CommunicationValidationResponse>} A promise that resolves to a CommunicationValidationResponse object indicating the validation status.
   * @throws {Error} Throws an error if something unexpected occurs during the validation process.
   * @description This function asynchronously validates an array of schedule times to ensure they meet the following criteria:
   * - Each time is in the format "HH:MM AM/PM", where HH is the hour (01-12), MM is the minute (00-59), and AM/PM specifies morning or afternoon.
   * - There are no duplicate schedule times in the array.
   * If any time in the array fails to meet these criteria, or if an unexpected error occurs during validation, the function returns a CommunicationValidationResponse object with the appropriate status and message.
   */
  validateTimes = async (times: string[]): Promise<Types.CommunicationValidationResponse> => {
    try {
      const duplicates = times.filter((item, index) => times.indexOf(item) !== index);
      if (duplicates.length > 0) {
        return {
          status: false,
          message: "Duplicate Schedule Time is not allowed.",
        };
      }
      const timeRegex = /^(0\d|1[0-2]):\d\d (AM|PM)$/;
      for await (let time of times) {
        if (!timeRegex.test(time)) {
          return {
            status: false,
            message: "Schedule Time is invalid.",
          };
        }
      }
      return {
        status: true,
      };
    } catch (error: any) {
      console.log("communication/validateTimes --> ", error?.message);
      return {
        status: false,
        message: "Something went wrong.",
      };
    }
  };

  /**
   * Validates an array of email addresses against a specific domain.
   * @async
   * @param {string[]} emails - An array of email addresses to validate.
   * @returns {Promise<boolean>} A Promise that resolves to true if all email addresses are valid for the domain, otherwise false.
   * @throws {Error} Throws an error if an unexpected error occurs during validation.
   */
  validateEmail = async (emails: string[]): Promise<boolean> => {
    try {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@dmclinical\.com$/;

      for await (const email of emails) {
        if (!emailRegex.test(email)) {
          return false;
        }
      }

      return true;
    } catch (error: any) {
      console.log("communication/validateEmail --> ", error?.message);
      return false;
    }
  };

  /**
   * Validates email fields within a sender configuration object.
   *
   * This function validates various email fields within a sender configuration object,
   * including sender email, reply-to email, CC (carbon copy) emails, and BCC (blind
   * carbon copy) emails. It ensures that each email address provided meets certain
   * criteria, such as being a valid email format and belonging to a specific domain.
   *
   * @async
   * @function validateEmailFields
   * @param {Types.SenderConfig} sender_config - The sender configuration object containing
   * email-related fields to be validated.
   * @returns {Promise<Types.CommunicationValidationResponse>} A promise that resolves to
   * a validation response object indicating whether the email fields are valid or not.
   * @throws {Error} If an unexpected error occurs during validation.
   */
  validateEmailFields = async (sender_config: Types.SenderConfig): Promise<Types.CommunicationValidationResponse> => {
    try {
      if (!sender_config?.sender_email) {
        return {
          status: false,
          message: "Sender Email is required.",
        };
      }

      let isEmailValid = await this.validateEmail([sender_config?.sender_email]);
      if (!isEmailValid) {
        return {
          status: false,
          message: "Sender Email is not valid email address, Only dmclinical emails are allowed.",
        };
      }

      if (sender_config?.reply_email && !(await this.validateEmail([sender_config?.reply_email]))) {
        return {
          status: false,
          message: "Reply To Email is not valid email address, Only dmclinical emails are allowed.",
        };
      }

      if (!_.isEmpty(sender_config?.cc)) {
        if (!Array.isArray(sender_config?.cc)) {
          return {
            status: false,
            message: "CC Email is required and must be an array.",
          };
        }
        if (!(await this.validateEmail(sender_config?.cc))) {
          return {
            status: false,
            message: "CC Email is not valid email address, Only dmclinical emails are allowed.",
          };
        }
      }

      if (!_.isEmpty(sender_config?.bcc)) {
        if (!Array.isArray(sender_config?.bcc)) {
          return {
            status: false,
            message: "BCC Email is required and must be an array.",
          };
        }

        if (!(await this.validateEmail(sender_config.bcc))) {
          return {
            status: false,
            message: "BCC Email is not valid email address, Only dmclinical emails are allowed.",
          };
        }
      }
      return {
        status: true,
      };
    } catch (error: any) {
      console.log("communication/validateEmailFields --> ", error?.message);
      return {
        status: false,
        message: "Something went wrong.",
      };
    }
  };

  /**
   * Asynchronously validates the repeat until configuration for a communication based on the provided frequency configuration and timezone.
   *
   * This function checks whether the repeat until configuration is valid according to the provided frequency configuration and timezone.
   * It ensures that the repeat until type is one of the allowed values ('date', 'no_of_times', 'always'), and performs additional validations
   * depending on the type. If any validation fails, it returns a validation response object indicating the failure status and an appropriate message.
   *
   * @async
   * @param {Types.FrequencyConfig} frequency_config The frequency configuration for the communication.
   * @param {string} timezone The timezone in which to perform the validation.
   * @returns {Promise<Types.CommunicationValidationResponse>} A promise that resolves to a validation response object indicating the validation status and message.
   */
  validateRepeatUntilStatusChange = async (
    frequency_config: Types.FrequencyConfig,
    timezone: string
  ): Promise<Types.CommunicationValidationResponse> => {
    try {
      const { date, no_of_times, always } = Types.RepeatUntilType;
      if (frequency_config.repeat_until?.type && ![date, no_of_times, always].includes(frequency_config.repeat_until.type)) {
        return {
          status: false,
          message: `Repeat Until Type must be one of the following ['${date}', '${no_of_times}', '${always}'].`,
        };
      }

      if (frequency_config.repeat_until?.type == date) {
        if (_.isEmpty(frequency_config.repeat_until?.end_date)) {
          return {
            status: false,
            message: "Repeat Until Date is required.",
          };
        }

        if (!(await this.validateDatetime(frequency_config.repeat_until.end_date, timezone, true, "YYYY-MM-DD"))) {
          return {
            status: false,
            message: "Repeat Until Date must be a date and greater than current date.",
          };
        }
      }

      if (frequency_config.repeat_until?.type == no_of_times) {
        if (!frequency_config.repeat_until?.duration || !Number.isInteger(parseInt(frequency_config.repeat_until.duration))) {
          return {
            status: false,
            message: "Repeat Until Duration is required and must be a number.",
          };
        }
      }
      return {
        status: true,
      };
    } catch (error: any) {
      console.log("communication/validateRepeatUntilStatusChange --> ", error?.message);
      return {
        status: false,
        message: "Something went wrong.",
      };
    }
  };

  /**
   * Validates the repeat until configuration for a study visit communication.
   * This function ensures that the provided frequency configuration is valid,
   * including the type of repeat until (days, weeks, or months) and the duration.
   * @async
   * @param {Types.FrequencyConfig} frequency_config - The frequency configuration object containing repeat until settings.
   * @returns {Promise<Types.CommunicationValidationResponse>} A promise resolving to an object indicating the validation status and message.
   * @throws {Error} If an unexpected error occurs during validation.
   */
  validateRepeatUntilStudyVisit = async (frequency_config: Types.FrequencyConfig): Promise<Types.CommunicationValidationResponse> => {
    try {
      const { days, weeks, months } = Types.RepeatUntilType;

      if (frequency_config.repeat_until?.type && ![days, weeks, months].includes(frequency_config.repeat_until.type)) {
        return {
          status: false,
          message: `Repeat Until Type must be one of the following ['${days}', '${weeks}', '${months}'].`,
        };
      }

      if (!_.isEmpty(frequency_config.repeat_until)) {
        if (!frequency_config.repeat_until?.duration || !Number.isInteger(parseInt(frequency_config.repeat_until?.duration))) {
          return {
            status: false,
            message: "Repeat Until Duration is required and must be a number.",
          };
        }
      }

      return {
        status: true,
      };
    } catch (error: any) {
      console.log("communication/validateRepeatUntilStatusChange --> ", error?.message);
      return {
        status: false,
        message: "Something went wrong.",
      };
    }
  };

  /**
   * Validates the repeat frequency of a study visit based on the provided configuration.
   * @async
   * @param {Types.FrequencyConfig} frequency_config - The configuration for the frequency of the study visit.
   * @param {string} timezone - The timezone in which the study visit is scheduled.
   * @returns {Promise<Types.CommunicationValidationResponse>} A promise that resolves to an object indicating the validation status and message.
   * @throws {Error} If an unexpected error occurs during validation.
   * @description This function checks various aspects of the provided frequency configuration for a study visit,
   * such as start date, visit type, interval type, interval schedule type, and number of days for the interval.
   * It returns a validation response indicating whether the configuration is valid or not, along with an error message if applicable.
   */
  validateRepeatFrequencyStudyVisit = async (
    frequency_config: Types.FrequencyConfig,
    timezone: string
  ): Promise<Types.CommunicationValidationResponse> => {
    try {
      if (!frequency_config?.start_date) {
        return {
          status: false,
          message: "Start Date is required and must be a datetime.",
        };
      }

      // if (!(await this.validateDatetime(frequency_config.start_date, timezone))) {
      //   return {
      //     status: false,
      //     message: "Start Date must be a datetime and greater than current datetime.",
      //   };
      // }

      if (!frequency_config?.study_visit_type) {
        return {
          status: false,
          message: "Study Visit Type is required.",
        };
      }

      const { scheduled_visit, completed_visit } = Types.StudyVisitType;
      if (![scheduled_visit, completed_visit].includes(frequency_config.study_visit_type)) {
        return {
          status: false,
          message: `Study Visit Type be one of the following ['${scheduled_visit}', '${completed_visit}'].`,
        };
      }

      if (!frequency_config?.interval?.type) {
        return {
          status: false,
          message: "Interval Type is required.",
        };
      }

      const { same_day, before, after } = Types.IntervalType;
      if (frequency_config.interval?.type && ![same_day, before, after].includes(frequency_config.interval.type)) {
        return {
          status: false,
          message: `Interval Type must be one of the following ['${same_day}', '${before}', '${after}'].`,
        };
      }

      const { days, hours, minutes } = Types.IntervalScheduleType;
      if (
        frequency_config?.interval?.type !== same_day &&
        (!frequency_config?.interval?.interval_schedule_type || ![days, hours, minutes].includes(frequency_config?.interval?.interval_schedule_type))
      ) {
        return {
          status: false,
          message: `Interval Schedule Type must be one of the following ['${days}', '${hours}', '${minutes}'].`,
        };
      }

      if (
        frequency_config.interval?.type !== same_day &&
        (!frequency_config.interval?.no_of_days || !Number.isInteger(parseInt(frequency_config.interval.no_of_days)))
      ) {
        return {
          status: false,
          message: "Interval No of days is required and must be a number.",
        };
      }
      return {
        status: true,
      };
    } catch (error: any) {
      console.log("communication/validateRepeatFrequencyStudyVisit --> ", error?.message);
      return {
        status: false,
        message: "Something went wrong.",
      };
    }
  };

  /**
   * Validates an array of repeat frequency times for daily communication scheduling.
   * Each item in the array must contain a valid array of times.
   *
   * @async
   * @param {Types.RepeatFrequencyTimes[]} schedule_time - An array of objects representing repeat frequency times.
   * @returns {Promise<Types.CommunicationValidationResponse>} A Promise that resolves to a validation response object.
   * @throws {Error} If an unexpected error occurs during validation.
   */
  validateRepeatFrequencyDaily = async (schedule_time: Types.RepeatFrequencyTimes[]): Promise<Types.CommunicationValidationResponse> => {
    try {
      for (let item of schedule_time) {
        // Validate times
        if (!Array.isArray(item.times)) {
          return {
            status: false,
            message: "Schedule Time Slot is required & must be an array of times.",
          };
        }

        let isTimeValid = await this.validateTimes(item.times);

        if (!isTimeValid.status) {
          return isTimeValid;
        }
      }
      return {
        status: true,
      };
    } catch (error: any) {
      console.log("communication/validateRepeatFrequencyDaily --> ", error?.message);
      return {
        status: false,
        message: "Something went wrong.",
      };
    }
  };

  /**
   * Validates the repetition frequency of a weekly schedule.
   * This function checks if the provided schedule times adhere to a weekly repetition pattern,
   * ensuring that each day appears only once and that times are properly formatted.
   * @async
   * @param {Types.RepeatFrequencyTimes[]} schedule_time - An array of objects representing scheduled times, each containing a day and corresponding times.
   * @returns {Promise<Types.CommunicationValidationResponse>} A Promise resolving to a CommunicationValidationResponse object indicating whether the validation was successful or not.
   * @throws {Error} Throws an error if any unexpected issue occurs during validation.
   */
  validateRepeatFrequencyWeekly = async (schedule_time: Types.RepeatFrequencyTimes[]): Promise<Types.CommunicationValidationResponse> => {
    try {
      let dayArray = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      let newDayArray: string[] = [];
      for (let item of schedule_time) {
        if (!item?.day) {
          return {
            status: false,
            message: `Day Slot is required.`,
          };
        }
        // Validate day
        if (!dayArray.includes(item?.day)) {
          return {
            status: false,
            message: `Day must be one of the following [${dayArray}].`,
          };
        }

        newDayArray.push(item.day);
        const duplicates = newDayArray.filter((item, index) => newDayArray.indexOf(item) !== index);
        if (duplicates.length > 0) {
          return {
            status: false,
            message: "Duplicate Schedule Day is not allowed.",
          };
        }

        // Validate times
        if (!Array.isArray(item.times)) {
          return {
            status: false,
            message: "Time is required & must be an array of times.",
          };
        }

        let isTimeValid = await this.validateTimes(item.times);

        if (!isTimeValid.status) {
          return {
            status: isTimeValid.status,
            message: isTimeValid.message,
          };
        }
      }
      return {
        status: true,
      };
    } catch (error: any) {
      console.log("communication/validateRepeatFrequencyMonthly --> ", error?.message);
      return {
        status: false,
        message: "Something went wrong.",
      };
    }
  };

  /**
   * Validates a monthly repeat frequency schedule with specified times.
   * @async
   * @param {Types.RepeatFrequencyTimes[]} schedule_time - An array of objects containing schedule details.
   * @param {string} timezone - The timezone to use for validation.
   * @returns {Promise<Types.CommunicationValidationResponse>} A Promise resolving to an object representing the validation result.
   * @throws {Error} If an unexpected error occurs during validation.
   * @description This function validates a monthly repeat frequency schedule, ensuring that each scheduled date and time is valid and unique. It checks if the schedule date, month day, and times are provided and in the correct format. It also verifies that the provided dates are unique within the schedule. If any validation fails, it returns a corresponding error message; otherwise, it indicates successful validation.
   */
  validateRepeatFrequencyMonthly = async (schedule_time: Types.RepeatFrequencyTimes[], timezone): Promise<Types.CommunicationValidationResponse> => {
    try {
      let dayArray: Date[] = [];
      for (let item of schedule_time) {
        // Validate date
        if (_.isEmpty(item.date) || !(await this.validateDatetime(item.date, timezone, false, "YYYY-MM-DD"))) {
          return {
            status: false,
            message: "Schedule Date is required and must be a date.",
          };
        }

        if (!item.day) {
          return {
            status: false,
            message: "Month Day is required.",
          };
        }

        const date = moment(item.date, "YYYY:MM:DD");
        const dayNumber = date.date();
        if (dayNumber != parseInt(item.day)) {
          return {
            status: false,
            message: "Day is invalid.",
          };
        }

        dayArray.push(item?.date);
        const duplicates = dayArray.filter((item, index) => dayArray.indexOf(item) !== index);
        if (duplicates.length > 0) {
          return {
            status: false,
            message: "Duplicate Date is not allowed.",
          };
        }

        // Validate times
        if (!Array.isArray(item.times)) {
          return {
            status: false,
            message: "Time is required & must be an array of times.",
          };
        }

        let isTimeValid = await this.validateTimes(item.times);

        if (!isTimeValid.status) {
          return {
            status: isTimeValid.status,
            message: isTimeValid.message,
          };
        }
      }
      return {
        status: true,
      };
    } catch (error: any) {
      console.log("communication/validateRepeatFrequencyMonthly --> ", error?.message);
      return {
        status: false,
        message: "Something went wrong.",
      };
    }
  };

  /**
   * Handles normal email sending.
   *
   * @async
   * @function - sendContent
   * @param {Request} req - Express Request object containing the webhook payload.
   * @param {Response} res - Express Response object for sending the response.
   * @returns {Promise<Response>} - Promise resolving to the HTTP response.
   */
  sendContent = async (req: UserRequest, res: Response): Promise<Response> => {
    try {
      if (req.body.content) {
        req.body.content = he.decode(req.body.content);
        req.body.subject = req.body.subject ? he.decode(req.body.subject) : req.body.subject;
      }

      let bodyData: any = {
        type: req.body.type,
        patient_id: req.body.patient_id,
        to: req.body.to,
        from: req.body.from,
        content: req.body.content,
        com_history_id: req.body.com_history_id ?? "",
        cc: req.body.cc ?? [],
        bcc: req.body.bcc ?? [],
        mediaUrl: req.body.media,
        subject: req.body.subject,
        username: req?.user?.FirstName + " " + req?.user?.LastName,
        user: (req.body.user = req?.user?.Email),
        is_notify: req.body?.is_notify || false,
        test: req.body?.test || false,
        test_id: req.body?.test_id || false,
        isTest: req.body?.isTest || false,
      };
      if (bodyData.type == "sms" && !req.body.isTest) {
        let response: any = await this.communicationService.sendSMS(bodyData);
        if (!response.message_id) {
          return res.status(400).json({
            status: false,
            message: response.message ? response.message : "Error while sending SMS",
          });
        }
        bodyData.message_id = response.message_id;
        bodyData.status = true;
      }

      if(bodyData?.test_id){
        bodyData.message_id = bodyData?.test_id
        bodyData.status = true;
      }
      await this.processCommunicationService.patientLastComData(bodyData);
      return res.status(200).json({
        status: true,
        message: "Success",
      });
    } catch (error: any) {
      // Log and respond with error message
      console.log("communication/sendContent --> ", error?.message);
      return res.status(500).json({
        status: false,
        message: error?.message,
      });
    }
  };

  sendTestContent = async (req: UserRequest, res: Response): Promise<Response> => {
    try {

      let response: any = await this.communicationService.sendTestSMS();
      console.log("🚀 ~ CommunicationController ~ sendTestContent= ~ response:", response)
      if (!response.message_id) {
        return res.status(400).json({
          status: false,
          message: response.message ? response.message : "Error while sending SMS",
        });
      }
      return res.status(200).json({
        status: true,
        message: "Success",
      });
    } catch (error: any) {
      // Log and respond with error message
      console.log("communication/sendContent --> ", error?.message);
      return res.status(500).json({
        status: false,
        message: error?.message,
      });
    }
  };

  /**
   * Handles Image upload in stoarge.
   *
   * @async
   * @function - uploadImage
   * @param {Request} req - Express Request object containing the webhook payload.
   * @param {Response} res - Express Response object for sending the response.
   * @returns {Promise<Response>} - Promise resolving to the HTTP response.
   */
  uploadImage = async (req: Request, res: Response): Promise<Response> => {
    let _id = new mongoTypes.ObjectId();
    let type = req.body.type;
    let blog = req?.body?.filename ? `test/${req.body.filename.replace(/\s+/g, '-')}_${_id}.${type}` : `test/${_id}.${type}`
    let mediaUrl = await this.commonUtils.uploadImage(req.body, blog);
    if (mediaUrl) {
      return res.status(200).json({
        status: true,
        data: mediaUrl,
      });
    }

    return res.status(400).json({
      status: false,
      message: "invalid image",
    });
  };

  testApi = async (req: Request, res: Response): Promise<Response> => {
    try {
      let response = await buildNotifications(
        { type: Types.IntervalType.before, no_of_days: "3", interval_schedule_type: Types.IntervalScheduleType.days },
        new Date("2024-06-13T20:00:00Z"),
        {
          type: Types.RepeatFrequencyType.daily,
          schedule_time: [{ times: ["1:30 AM", "1:35 AM", "1:40 AM"] }],
        },
        {}
      );

      console.log("CommunicationController --> testApi= --> response ->>>>>>>>>>>>>>>>>>>>>>>>>", response);
      return res.status(200).json({
        status: true,
        message: "Working.",
        data: response,
      });
    } catch (error: any) {
      console.log("CommunicationController --> testApi= --> error ->>>>>>>>>>>>>>>>>>>>>>>>>", error);
      return res.status(200).json({
        status: true,
        message: error.message,
      });
    }
  };

  testTinyMce = async (req: Request, res: Response): Promise<Response> => {
    try {
      let ischange = req.body?.ischange ?? false;
      const cacheKey = `tiny_mce_test`; // Unique key for caching
       // // Check if data exists in cache
       let cachedData = await this.commonUtils.getCache(cacheKey);
       if (cachedData && !ischange) {
          return res.status(200).json({
            status: true,
            isTinyMce:cachedData.isTinyMce
          });
       }

      // Cache the fetched data for 1 hour
      ischange =  cachedData.isTinyMce ? false : true
      await this.commonUtils.setCache(cacheKey, {isTinyMce:ischange}, (86400));

      return res.status(200).json({
        status: true,
        isTinyMce:ischange
      });

    } catch (error: any) {
      console.log("CommunicationController --> testApi= --> error ->>>>>>>>>>>>>>>>>>>>>>>>>", error);
      return res.status(200).json({
        status: true,
        message: error.message,
      });
    }
  };

  newList = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { Status, SearchString } = req.query;
      let { skip, take, sorted, where, requiresCounts } = req.body;

      // take = test == "yes" ? s_skip : take;
      const LIMIT = parseInt(take as string ?? "20"); // Maximum number of items per page

      let matchQuery: any = {};

      // Add dynamic query from 'where' if it exists and is not empty
      if (where && !_.isEmpty(where)) {
        matchQuery.$and = [...buildMongoQuery(where)];
      }

      // Add status condition only if 'Status' is provided
      if (Status) {
        matchQuery.$and = (matchQuery.$and || []).concat({ status: Status });
      }

      // Add search conditions if 'SearchString' exists
      if (SearchString) {
        matchQuery["$or"] = [
          { type: { $regex: SearchString, $options: "i" } },
          { token: { $regex: SearchString, $options: "i" } },
          { title: { $regex: SearchString, $options: "i" } },
          { "department.name": { $regex: SearchString, $options: "i" } }
        ];
      }

      // Ensure that matchQuery is {} when no conditions are applied
      if (_.isEmpty(matchQuery)) {
        matchQuery = {};
      }

      // Sorting
      const sortQuery: any = {};
      if (sorted) {
        sorted.forEach((sort: { name: string | number; direction: string; }) => {
          sortQuery[sort.name] = sort.direction === 'ascending' ? 1 : -1;
        });
      }

      let paginationData = { skip: skip ? Number(skip) : 0, limit: LIMIT };

      // Retrieving script data with pagination and filtering
      let communicationData = await this.communicationService.new_list(paginationData, matchQuery, sortQuery);

      const TOTAL_COUNT: number = !_.isEmpty(communicationData[0]?.total) ? communicationData[0]?.total[0]?.count : 0;

      // Generating pagination data
      // const pagination = await this.commonUtils.pagination(TOTAL_COUNT, PAGE, LIMIT);

      let resp: any = communicationData[0]?.data ?? [];
      if (requiresCounts) {
        resp = {
          status: true,
          result: communicationData[0]?.data ?? [],
          count: TOTAL_COUNT,
        }
      }
      // Returning response script data
      return res.status(200).json(resp);
    } catch (error: any) {
      // Logging error message
      console.log("communication/newList -->", error?.message);
      // Returning error response
      return res.status(400).json({
        status: false,
        message: error?.message,
      });
    }
  };
}

// Function to convert operators to MongoDB expressions (reused from previous answer)
const buildMongoCondition = (predicate: any) => {
  const { field, operator, value, ignoreCase } = predicate;

  switch (operator) {
    case "equal":
      return { [field]: value };
    case "notequal":
      return { [field]: { $ne: value } };
    case "startswith":
      return { [field]: { $regex: `^${value}`, $options: ignoreCase ? 'i' : '' } };
    case "doesnotstartwith":
      return { [field]: { $not: { $regex: `^${value}`, $options: ignoreCase ? 'i' : '' } } };
    case "contains":
      return { [field]: { $regex: value, $options: ignoreCase ? 'i' : '' } };
    case "doesnotcontain":
      return { [field]: { $not: { $regex: value, $options: ignoreCase ? 'i' : '' } } };
    case "isempty":
      return { [field]: { $eq: "" } };
    case "isnotempty":
      return { [field]: { $ne: "" } };
    // Add other operators as needed (like, endswith, doesnotendwith)
    default:
      return {};
  }
};

// Function to build the MongoDB query (reused from previous answer)
const buildMongoQuery = (filters: any[]) => {
  const conditions = filters.map((filter) => {
    if (filter.isComplex) {
      const innerQuery = buildMongoQuery(filter.predicates);
      return filter.condition === "or" ? { $or: innerQuery } : { $and: innerQuery };
    } else {
      return buildMongoCondition(filter);
    }
  });

  return conditions;
};
