import _ from "lodash";
import moment from "moment";
import { ServiceBusUtils } from "../utils/serviceBus";
import { CommunicationRepository } from "../repository";
import { CommonUtils } from "../utils";
const commonUtils = CommonUtils.getInstance();
import sendgridClient, { MailDataRequired } from "@sendgrid/mail";
import {
  CommunicationData,
  CommunicationChangeStatus,
  CommunicationStatus,
  CommunicationResponse,
  PaginationObject,
} from "../types/communication";
import AsyncLock from "async-lock";
const lock = new AsyncLock();
/**
 * Service handling communication-related operations.
 * This service manages interactions with communication repositories and utilizes common utilities.
 * @class - CommunicationService
 */
export class CommunicationService {
  /**
   * The repository responsible for communication-related data persistence.
   * @private
   */
  private communicationRepository: CommunicationRepository;
  /**
   * Utility functions shared across the communication service.
   * @private
   */
  private serviceBusUtils: ServiceBusUtils;

  /**
   * Constructs a new instance of CommunicationService.
   * Initializes the communication repository and common utilities.
   */
  constructor() {
    this.communicationRepository = new CommunicationRepository();
    this.serviceBusUtils = ServiceBusUtils.getInstance();
  }

  /**
   * Retrieves a list of items from the communication repository asynchronously.
   *
   * This method fetches a list of items from the communication repository based on the provided criteria.
   *
   * @async
   * @function list
   * @param {number} skip - The number of items to skip from the beginning of the list.
   * @param {number} limit - The maximum number of items to retrieve.
   * @param {object} [condition={}] - An optional object specifying additional conditions for filtering the results.
   * @returns {Promise<CommunicationResponse[]|[]>} A Promise that resolves to an array of items retrieved from the communication repository.
   */
  async list(skip: number, limit: number, condition: object = {}) {
    return await this.communicationRepository.list(skip, limit, condition);
  }

  /**
   * Retrieves a list of items from the communication repository asynchronously.
   *
   * This method fetches a list of items from the communication repository based on the provided criteria.
   *
   * @async
   * @function list
   * @param {object} pagination - skip - The number of items to skip from the beginning of the list. & limit - The maximum number of items to retrieve.
   * @param {object} [condition={}] - An optional object specifying additional conditions for filtering the results.
   * @param {object} sorted - An optional object with sorting data 
   * @returns {Promise<CommunicationResponse[]|[]>} A Promise that resolves to an array of items retrieved from the communication repository.
   */
  async new_list(pagination: PaginationObject, condition: object = {}, sorted: [] | undefined) {
    return await this.communicationRepository.new_list(pagination, condition, sorted);
  }

  /**
   * Asynchronously creates a new communication record using the provided data.
   *
   * This method asynchronously creates a new communication record using the given data
   * and returns the result once the creation is complete.
   *
   * @async
   * @param {CommunicationData} data - The data to be used for creating the communication record.
   * @returns {Promise<CommunicationResponse|null>} A Promise that resolves to the newly created communication record.
   */
  async createOne(data: CommunicationData) {
    const result = await this.communicationRepository.createOne(data);
    return result;
  }

  /**
   * Processes hashtags by sending a message to a service bus.
   *
   * This function checks if the provided hashtags array is empty. If it is,
   * it logs a message and returns null. If the hashtags array is not empty,
   * it sends a message to the service bus with the provided id and hashtags.
   *
   * @param {string} id - The identifier associated with the hashtags to be processed.
   * @param {Array<any>} [hashtags] - An optional array of hashtags to be processed.
   * @returns {Promise<null>} Returns null after processing the hashtags.
   */
  async processHashtags(id: string, hashtags?: any[], type?: any) {
    try {
      if (_.isEmpty(hashtags)) {
        console.log("Communication :::: Empty hashtags");
        return null;
      }
      this.serviceBusUtils.sendMessage(`${process.env.NODE_ENV ?? "local"}_services_communication`, {
        body: {
          type: "scriptReposHandler",
          data: {
            event: "process-hashtags",
            data: { id: id, hashtags: hashtags, type: "mass-com" },
          },
        },
      });
    } catch (error: any) {
      // Log and respond with error message
      console.log("Communication :::: ", error?.message);
      return null;
    }
  }
  /**
   * Updates communication data for a specific ID.
   *
   * @async
   * @param {string} id - The ID of the communication data to be updated.
   * @param {CommunicationData} data - The updated communication data.
   * @returns {Promise<CommunicationResponse|null>} A promise that resolves with the result of the update operation.
   */
  async updateOne(id: string, data: any) {
    const result = await this.communicationRepository.updateOne(id, data);
    return result;
  }

  async sendNotification(data: any) {
    const messageResp = await this.serviceBusUtils.sendMessage(`${process.env.NODE_ENV ?? "local"}_services_communication`, {
      body: {
        type: "handleNotificationHandler",
        data: {
          event: "save-incoming-notification",
          data: data,
        },
      },
    });
  }

  /**
   * Finds communication data by its ID.
   *
   * @async
   * @param {string} id - The ID of the communication data to find.
   * @returns {Promise<CommunicationResponse|null>} A promise that resolves with the communication data found.
   */
  async findOneById(id: string) {
    let result = await this.communicationRepository.findOneById(id);
    return result;
  }

  /**
   * Asynchronously counts documents in the communication repository based on the provided condition.
   *
   * @async
   * @param {object} condition - The condition object to filter documents. Defaults to an empty object if not provided.
   * @returns {Promise<number>} A promise that resolves to the count of documents.
   */
  async countDocument(condition: object = {}) {
    return await this.communicationRepository.countDocument(condition);
  }

  /**
   * Asynchronously pins or unpins a communication script identified by its ID.
   *
   * @async
   * @param {string} id - The ID of the communication script to pin or unpin.
   * @returns {Promise<{status: boolean; message: string;} | null>} A promise that resolves to an object containing the status and message of the operation.
   */
  async pin(id: string) {
    try {
      // Retrieve the script from the repository based on the provided ID.
      let communication = await this.communicationRepository.findOneById(id);

      if (_.isEmpty(communication)) {
        return null;
      }

      if (!communication.is_pinned) {
        const { MAX_PIN_COUNT } = process.env;
        let count = await this.communicationRepository.countDocument({
          is_pinned: true,
          status: communication.status,
        });
        if (count >= parseInt(MAX_PIN_COUNT || "5")) {
          return {
            status: false,
            message: "Max 5 pins allowed",
          };
        }
      }

      let data = {
        is_pinned: !communication.is_pinned,
        pin_order_time: communication.is_pinned ? null : moment(),
      };

      // update a new script with the modified data.
      let updated = await this.communicationRepository.updateOne(id, data);
      return {
        status: true,
        message: updated?.is_pinned ? "Communication pinned successfully" : "Communication unpinned successfully",
      };
    } catch (error: any) {
      // Log and respond with error message
      console.log("CommunicationService/pin --> ", error?.message);
      return null;
    }
  }

  /**
   * Toggles the active status of a communication script.
   * @async
   * @param {string} id - The ID of the communication script to toggle.
   * @returns {Promise<CommunicationResponse|null>} Returns the updated communication script if successful, otherwise null.
   */
  async activeInactive(id: string) {
    try {
      // Retrieve the script from the repository based on the provided ID.
      let communication = await this.communicationRepository.findOneById(id);

      if (_.isEmpty(communication) || communication.status != "published") {
        return null;
      }

      // update a new script with the modified data.
      const response: any = await this.communicationRepository.updateOne(id, { is_active: !communication.is_active });
      if (!response?.is_active) {
        this.inactiveOngoingMassComm(response?._id.toString());
      }
      return response;
    } catch (error: any) {
      // Log and respond with error message
      console.log("CommunicationService/activeInactive --> ", error?.message);
      return null;
    }
  }

  async sendSMS(data: any) {
    try {
      const accountSid = await commonUtils.getSecret(`${process.env.NODE_ENV ?? "local"}-TWILIO-ACCOUNTSID`);
      const authToken = await commonUtils.getSecret(`${process.env.NODE_ENV ?? "local"}-TWILIO-AUTHTOKEN`);
      const messagingServiceSid = await commonUtils.getSecret(`${process.env.NODE_ENV ?? "local"}-TWILIO-MESSAGE-SERVICE-ID`);
      const client = require("twilio")(accountSid, authToken);

      const envArr = ["local", "development", "qa", "staging"];
      const env = process.env.NODE_ENV ?? "local";
      const body = envArr.includes(env) ? env + "\n" + data.content : data.content;
      let toNumber: string;
      if (data.to.startsWith("+1")) {
        toNumber = data.to;
      } else {
        toNumber = "+1" + data.to;
      }
      let smsOptions: any = {
        body: body ?? "",
        from: data.from,
        to: toNumber,
        messagingServiceSid: messagingServiceSid,
      };
      if (data?.mediaUrl && !_.isEmpty(data?.mediaUrl)) {
        smsOptions.mediaUrl = _.isArray(data?.mediaUrl) ? data?.mediaUrl : [data?.mediaUrl];
      }

      if (data.test == "true") {
        return {
          message_id: data?.test_id || moment().unix(),
          test: true,
          status: true,
        };
      }

      let response = await client.messages.create(smsOptions);
      if (response) {
        console.log("in sendSMS Success response: ", response);
        return {
          message_id: response?.sid,
          status: true,
        };
      }

      return {
        message_id: null,
        status: true,
      };
    } catch (error: any) {
      console.error("Error sendig SMS:", error?.message);
      return {
        message_id: null,
        status: true,
        message: error?.message,
      };
    }
  }
  async sendTestSMS() {
    try {
      const accountSid = await commonUtils.getSecret(`${process.env.NODE_ENV ?? "local"}-TWILIO-ACCOUNTSID`);
      const authToken = await commonUtils.getSecret(`${process.env.NODE_ENV ?? "local"}-TWILIO-AUTHTOKEN`);
      const messagingServiceSid = await commonUtils.getSecret(`${process.env.NODE_ENV ?? "local"}-TWILIO-MESSAGE-SERVICE-ID`);
      const client = require("twilio")(accountSid, authToken);

      let smsOptions: any = {
        body: `Hello test message for test time:${moment().unix()}`,
        from: "+19036003627",
        to: "5677043636",
        messagingServiceSid: messagingServiceSid,
        mediaUrl: ["https://dmclinicstaging.blob.core.windows.net/commodule/test/66dec0f512ce11a8c904fe74.jpeg",],
      };

      let response = await client.messages.create(smsOptions);
      if (response) {
        console.log("in sendSMS Success response: ", response);
        return {
          message_id: response?.sid,
          status: true,
        };
      }

      return {
        message_id: null,
        status: true,
      };
    } catch (error: any) {
      console.error("Error sendig SMS:", error?.message);
      return {
        message_id: null,
        status: true,
        message: error?.message
      };
    }
  }

  async sendEmail(data: any) {
    sendgridClient.setApiKey(await commonUtils.getSecret("SENDGRID-KEY-SECRET"));
    try {
      let sendObj: MailDataRequired;
      sendObj = {
        to: data.to,
        from: data.from,
        subject: data.subject,
        html: data.content,
      };

      if (!_.isEmpty(data.cc)) {
        sendObj.cc = data.cc;
      }

      if (!_.isEmpty(data.bcc)) {
        sendObj.bcc = data.bcc;
      }

      let response = await sendgridClient.send(sendObj);
      if (response && response[0]?.statusCode && response[0]?.headers["x-message-id"]) {
        console.log("in sendEmail Success response: ", response);
        return {
          message_id: response[0]?.headers["x-message-id"],
          status: true,
        };
      }
      return false;
    } catch (error) {
      console.error("Error sending email:", error);
      console.log("in sendEmail Error : ", error);
      return false;
    }
  }

  /**
   * Asynchronously updates the status of a communication based on provided data.
   *
   * @param {CommunicationResponse} communication - The communication object to update.
   * @param {CommunicationChangeStatus} data - The data containing the new status and user information.
   * @param {string} token - The authentication token for authorization.
   * @returns {Promise<CommunicationResponse|null>} - A promise resolving to the updated communication object or null if unsuccessful.
   */
  async changeStatus(communication: CommunicationResponse, data: CommunicationChangeStatus, token: string) {
    try {
      // Retrieve the script from the repository based on the provided ID.
      const { draft, pending_review, published, discarded, decline, restore, deleted } = CommunicationStatus;

      if (_.isEmpty(communication) || (communication?.status && [published, deleted].includes(communication?.status))) {
        return null;
      }

      if (![discarded, deleted, restore].includes(data.status)) {
        const { department_id, type, title } = communication;
        if (!department_id || !type || !title) {
          return null;
        }
      }

      if (communication.status == draft && ![discarded, pending_review].includes(data.status)) {
        return null;
      }

      if (communication.status == pending_review && ![decline, published].includes(data.status)) {
        return null;
      }

      if (communication.status == discarded && ![restore, deleted].includes(data.status)) {
        return null;
      }

      const { _id, ...communicationData } = communication;

      communicationData.status = data.status == decline || data.status == restore ? draft : data.status;

      if (data.status == published) {
        communicationData.approved_on = moment().toDate();
        communicationData.approved_by = data.user;
      }

      if (data.status == published && !_.isEmpty(communicationData?.script_id)) {
        this.updateScriptUsedCount(communicationData?.script_id?.toString(), token);
      }

      if (data.status == discarded) {
        communicationData.deleted_on = moment().toDate();
        communicationData.deleted_by = data.user;
      }

      if (data?.script_content && !_.isEmpty(data.script_content)) {
        communicationData.script_content = data.script_content;
      }

      communicationData.is_pinned = false;
      communicationData.updated_by = data.user;
      communicationData.created_username = data.created_username;

      communicationData.updated_on = moment().toDate();

      let result = await this.communicationRepository.updateOne(_id, communicationData);
      return result;
    } catch (error: any) {
      // Log and respond with error message
      console.log("CommunicationService/changeStatus --> ", error?.message);
      return null;
    }
  }

  /**
   * Asynchronously finds all communications by recurring status.
   *
   * This method queries the communication repository to retrieve all communications
   * that match the provided condition regarding their recurring status.
   *
   * @async
   * @param {object} [condition={}] - Optional condition object to filter communications.
   * @returns {Promise<CommunicationResponse[]|[]>} A promise that resolves to an array of communications matching the condition.
   */
  async findAllByRecurringStatus(condition: object = {}) {
    return await this.communicationRepository.findAllByRecurringStatus(condition);
  }

  /**
   * Asynchronously updates the usage count of a script.
   * This function sends a POST request to the specified API endpoint
   * to increment the usage count of the given script ID.
   *
   * @async
   * @param {string} script_id - The ID of the script to update the usage count for.
   * @param {string} authToken - The authorization token for accessing the API.
   * @returns {Promise<boolean>} A Promise that resolves to null upon completion.
   */
  async updateScriptUsedCount(script_id: string, authToken: string) {
    try {
      this.serviceBusUtils.sendMessage(`${process.env.NODE_ENV ?? "local"}_services_communication`, {
        body: {
          type: "scriptReposHandler",
          data: {
            event: "update-script-used-count",
            data: script_id,
          },
        },
      });
      return true;
    } catch (error: any) {
      // Log and respond with error message
      console.log("CommunicationService/updateScriptUsedCount --> ", error?.message);
      return false;
    }
  }

  /**
   * Asynchronously finds and returns a document from the Communication collection that matches the given condition,
   * sorting by the token field in descending order.
   *
   * This function queries the Communication collection to find a single document that satisfies the provided condition,
   * sorting by token in descending order.
   *
   * @param {object} [condition={}] The optional condition to filter documents. Defaults to an empty object.
   * @returns {Promise<any>} A Promise that resolves with the found document or null if not found.
   *                         If an error occurs during the operation, resolves with null.
   * @throws {Error} - If an unexpected error occurs during the operation.
   */
  async findOne(condition: object = {}): Promise<any> {
    try {
      return await this.communicationRepository.findOne(condition);
    } catch (error: any) {
      console.log("CommunicationRepository/findOne Error -->", error?.message);
      return null;
    }
  }

  async generateToken(type: string) {
    return lock.acquire("generateToken", async () => {
      try {
        let prefix: string;
        if (type === "sms") {
          prefix = "S";
        } else if (type === "email") {
          prefix = "E";
        } else {
          prefix = "U"; // Default prefix for other types
        }
        // Generate the token based on the type
        const lastCommunication: any = await this.findOne({ token: { $regex: prefix, $options: "i" } });
        let lastToken = lastCommunication ? lastCommunication.token : `${prefix}0000`;
        console.log("lastToken", lastToken);
        const numericPart = parseInt(lastToken.slice(1), 10);
        const newNumericPart = numericPart + 1;
        const paddedNewNumericPart = newNumericPart.toString().padStart(4, "0");
        return prefix + paddedNewNumericPart;
      } catch (error) {
        console.log("error", error);
        return null;
      }
    });
  }

  inactiveOngoingMassComm(communication_id: string) {
    console.log("CommunicationService --> inactiveOngoingMassComm --> communication_id ->>>", communication_id);
    try {
      this.serviceBusUtils.sendMessage(`${process.env.NODE_ENV ?? "local"}_services_communication`, {
        body: {
          type: "patientDataHandler",
          data: {
            event: "inactive-ongoing-mass-comm",
            data: {
              communication_id: communication_id,
            },
          },
        },
      });
      return true;
    } catch (error: any) {
      // Log and respond with error message
      console.log("CommunicationService/inactiveOngoingMassComm --> ", error?.message);
      return false;
    }
  }
}
