// ProcessCommunication.ts

import moment from "moment";
import moment_timzone from "moment-timezone";

import {
  CommunicationResponse,
  Interval,
  IntervalType,
  RepeatFrequency,
  RepeatUntil,
  StudyVisitType,
  FrequencyConfigType,
  FrequencyType,
  CommunicationStatus,
  RepeatFrequencyType,
  RepeatUntilType,
  Delay,
} from "../types/communication";
import { ServiceBusUtils } from "../utils/serviceBus";
import { CommunicationService } from "./communication";
import { buildNotifications } from "./buildNotifications";
import { CommonUtils } from "../utils";
import _ from "lodash";

const commonUtils = CommonUtils.getInstance();

/**
 * Service for facilitating communication processes within the application.
 * This class manages communication between different components or services
 * using utilities like ServiceBusUtils and CommunicationService.
 */
export class ProcessCommunicationService {
  /**
   * Utility for managing service bus operations.
   * @type {ServiceBusUtils}
   * @private
   */
  private serviceBusUtils: ServiceBusUtils;
  /**
   * Service responsible for communication operations.
   * @type {CommunicationService}
   * @private
   */
  private communicationService: CommunicationService;

  /**
   * Initializes a new instance of the ProcessCommunicationService class.
   * This constructor initializes the required utilities and services.
   * @constructor
   */
  constructor() {
    this.serviceBusUtils = ServiceBusUtils.getInstance();
    this.communicationService = new CommunicationService();
  }

  /**
   * Processes a communication item based on its status and scheduling criteria.
   * @async
   * @param {CommunicationData} data - The data of the communication to process.
   */
  async processCommunication(data: CommunicationResponse) {
    console.log(
      "MASS COMM: Process Comm: ",
      data?._id.toString(),
      " processComm Function Called",
      commonUtils.getCurrentLocation(),
      data.status,
      data.is_active,
      data.frequency,
      data.frequency_config?.type
    );

    // Only Process Publushed and Active Communications
    // If a scheduled communication gets inactive / disabled we'll no longer process it
    if (data.status === "published" && data.is_active) {
      if (data.frequency === "one_time") {
        // Send Process immediately which set for Now
        if (data.frequency_config?.type === "now") {
          await this.processImmediately(data);
        }

        // Let's add Scheduled Check in our Queue
        if (data.frequency_config?.type === "scheduled") {
          await this.scheduleForLater(data);
        }
      } else if (data.frequency === "recurring") {
        // TODO: Write code manage Recurring communications
        /* As of now: Based on the User Story: #2895 We need to process communication upon Status Change
         No need to process existing patients
        */
      }
    } else {
      console.log(
        "MASS COMM: Process Comm: ",
        data?._id.toString(),
        " processComm else",
        commonUtils.getCurrentLocation(),
        "Mass Comm no longer active: " + data._id
      );

      // TODO: Remove all the scheduled communications from DB where Com ID = this._id from communicationHistoryRepository
    }
  }

  async TestprocessCommunication(data) {
    console.log(
      "MASS COMM: Process Comm: ",
      data?._id.toString(),
      " processComm Function Called",
      commonUtils.getCurrentLocation(),
      data.status,
      data.is_active,
      data.frequency,
      data.frequency_config?.type
    );

    console.log("🚀 ~ ProcessCommunicationService ~ TestprocessCommunication ~  data.isTest:", data);
    // Only Process Publushed and Active Communications
    // If a scheduled communication gets inactive / disabled we'll no longer process it
    if (data.status === "published" && data.is_active) {
      if (data.frequency === "one_time") {
        // Send Process immediately which set for Now
        if (data.frequency_config?.type === "now") {
          console.log("data.frequency_config ============>", data.frequency_config);
          await this.TestprocessImmediately(data);
        }
      } else if (data.frequency === "recurring") {
        // TODO: Write code manage Recurring communications
        /* As of now: Based on the User Story: #2895 We need to process communication upon Status Change
         No need to process existing patients
        */
      }
    } else {
      console.log(
        "MASS COMM: Process Comm: ",
        data?._id.toString(),
        " processComm else",
        commonUtils.getCurrentLocation(),
        "Mass Comm no longer active: " + data._id
      );

      // TODO: Remove all the scheduled communications from DB where Com ID = this._id from communicationHistoryRepository
    }
  }

  /**
   * Processes the communication immediately test load.
   * @private
   * @async
   * @param {CommunicationResponse} data - The data of the communication to process.
   */
  private async TestprocessImmediately(data) {
    console.log("🚀 ~ ProcessCommunicationService ~ processImmediately ~ processImmediately:");
    let communication_data = {
      _id: data._id,
      title: data.title,
      type: data.type,
      sender_config: data.sender_config,
      script_content: data.script_content,
      user: data.created_by,
      username: data.created_username,
      communication_token: data.token,
      study: data.study,
      inclusion: data?.inclusion ?? null,
      exclusion: data?.exclusion ?? null,
      frequency: data?.frequency,
      frequency_config: data?.frequency_config,
      department_id: data.department_id,
      isTest: true,
    };
    this.buildPatientPool(communication_data);
    console.log(
      "MASS COMM: Process Comm:  ",
      data?._id.toString(),
      " processImmediately Done",
      commonUtils.getCurrentLocation(),
      "Processed communication immediately for:",
      data
    );
  }

  /**
   * Processes the communication immediately.
   * @private
   * @async
   * @param {CommunicationResponse} data - The data of the communication to process.
   */
  private async processImmediately(data: CommunicationResponse) {
    console.log("🚀 ~ ProcessCommunicationService ~ processImmediately ~ processImmediately:");
    if(data._id.toString() == "6707e5bed37d4c45b855eba7"){
      return true;
    }
    let username = data.created_username;
    if (data.type === "email") {
      let distroCacheData = (await commonUtils.getCache(`distroGroup`)) || [];
      if (distroCacheData) {
        let isDistro = await distroCacheData.find((group) => group.group_email === data.sender_config?.sender_email);
        if (isDistro) {
          console.log("isDistro --> SaveOutbound", isDistro);
          username = isDistro?.group_name;
        }
      }
    }
    let communication_data = {
      _id: data._id,
      title: data.title,
      type: data.type,
      sender_config: data.sender_config,
      script_content: data.script_content,
      media: data?.media ?? null,
      user: data?.approved_by ? data?.approved_by : data.created_by,
      username: username,
      communication_token: data.token,
      study: data.study,
      inclusion: data?.inclusion ?? null,
      exclusion: data?.exclusion ?? null,
      frequency: data?.frequency,
      frequency_config: data?.frequency_config,
      department_id: data.department_id,
    };
    this.buildPatientPool(communication_data);
    console.log(
      "MASS COMM: Process Comm:  ",
      data?._id.toString(),
      " processImmediately Done",
      commonUtils.getCurrentLocation(),
      "Processed communication immediately for:",
      data
    );
  }

  /**
   * Schedule the communication which are scheduled to run in future.
   * @private
   * @async
   * @param {CommunicationResponse} data - The data of the communication to process.
   */
  private async scheduleForLater(data: CommunicationResponse) {
    const scheduledTime = moment_timzone.tz(data.frequency_config?.scheduled_time, data.timezone).utc();
    console.log("scheduledTime==>>>", scheduledTime);
    // const scheduledTime = moment(data.frequency_config?.scheduled_time);

    if (!scheduledTime.isValid() || !data.frequency_config?.scheduled_time) {
      console.log(
        "MASS COMM: Process Comm: ",
        data?._id.toString(),
        " scheduleForLater: In the Function",
        commonUtils.getCurrentLocation(),
        "scheduledTime => Invalid Scheduled Time"
      );
      return;
      // Handle the case where scheduled_time is not provided
    }
    const now = moment(); // Current time
    console.log(
      "MASS COMM: Process Comm: ",
      data?._id.toString(),
      " scheduleForLater: In the Function",
      commonUtils.getCurrentLocation(),
      "now => ",
      now
    );
    const differenceInHours = scheduledTime.diff(now, "hours");
    const differenceInMinutes = scheduledTime.diff(now, "minutes");
    console.log(
      "MASS COMM: Process Comm:  ",
      data?._id.toString(),
      " scheduleForLater: In the Function",
      commonUtils.getCurrentLocation(),
      "scheduledTime => ",
      scheduledTime,
      "Comm Time Diff => Hours ",
      differenceInHours,
      " Minutes: ",
      differenceInMinutes
    );

    if (differenceInMinutes < 0) return;
    // If Difference is less than 5 minutes then process it immediately
    if (differenceInMinutes <= 5) {
      this.processImmediately(data);
    } else {
      let nextRunUTC;
      // If to be sent after 1 day, let's check again after 24 hours
      if (differenceInHours > 23) {
        nextRunUTC = moment.utc().add(24, "hours").toDate();
      } else {
        // If to run with-in 24 hours let's directly schedule it to run before 5 minutes
        nextRunUTC = scheduledTime.add(-5, "minutes").toDate();
      }

      const sequenceNumber = this.serviceBusUtils.sendMessage(`${process.env.NODE_ENV ?? "local"}_services_communication`, {
        scheduledEnqueueTimeUtc: nextRunUTC,
        body: {
          type: "handleMassCommHandler",
          data: { event: "process-scheduled-mass-comm", "com-data": data },
        },
      });

      // TODO: Store Sequence Number in Mass Comm - Upon Mass Comm getting disabled let's cancel all the scheduled messages
      console.log(
        "MASS COMM: Process Comm:  ",
        data?._id.toString(),
        " scheduleForLater Done:",
        commonUtils.getCurrentLocation(),
        "Scheduled to run again ==> ",
        nextRunUTC,
        "Scheduled Sequence Number: ",
        sequenceNumber
      );
    }
  }

  /**
   * Process Mass Comm which are set as Recurring to run on Patient Status / Study Visit Status
   * @private
   * @async
   * @param {CommunicationResponse} data - The data of the communication to process.
   */
  private async processRecurring(data: any) {
    this.processPatientCommunications(data);
  }

  /**
   * Processes patient communications based on status change events.
   *
   * @async
   * @param {Object} data - Data object containing information about the status change event.
   * @returns {Promise<void>} - A Promise that resolves when processing is complete.
   */
  private async processPatientCommunications(data) {
    console.log(
      "MASS COMM: Process Comm: processPatientCommunications received status change event",
      commonUtils.getCurrentLocation(),
      "Received Data ==> ",
      data
    );

    if (!["patient_status_change", "patient_study_visit_status_change"].includes(data.type)) {
      console.log(
        "MASS COMM: Process Comm: ",
        data?._id.toString(),
        " processPatientCommunications check if status match: ",
        commonUtils.getCurrentLocation(),
        "Not Matching ==> ",
        data.type
      );
      return null;
    }
    //TODO : once confirm received date time timezone we have to convert accordingly

    // Parse the time in UTC
    const utcMoment = moment.utc(data.datetime);
    let utcTime = utcMoment.utc().format();
    // let utcTime;

    // Convert the parsed UTC time to the desired timezone without changing the local time
    // const cstTime = utcMoment.clone().tz("America/Chicago", true);
    // utcTime = cstTime.utc().format();

    const patientId = data.patient_Id;
    const isTest = data.isTest ? data.isTest : false;
    const datetime = utcTime;
    let communications: CommunicationResponse[];
    let condition: any = {};
    const { status_change, study_visit } = FrequencyConfigType;
    const { scheduled_visit, completed_visit } = StudyVisitType;
    let current_datetime = new Date().toISOString();
    condition.status = CommunicationStatus.published;
    condition.frequency = FrequencyType.recurring;
    condition.is_active = true;
    condition["$and"] = [
      // Need to check why it's not working
      // {
      //   $or: [{ "frequency_config.start_date": { $lt: current_datetime } }, { "frequency_config.start_date": null }],
      // },
      {
        $or: [{ "study.id": data.study_id }, { study: null }, { study: {} }],
      },
    ];

    if (data.type === "patient_status_change") {
      condition["frequency_config.type"] = status_change;
    }

    if (data.type === "patient_study_visit_status_change") {
      condition["frequency_config.type"] = study_visit;

      // check if visit is scheduled or completed
      if (data.study_visit_type == "scheduled") {
        condition["frequency_config.study_visit_type"] = scheduled_visit;
      } else if (data.study_visit_type == "completed") {
        condition["frequency_config.study_visit_type"] = completed_visit;
      }

      // filter by study visit we received from comtrak
      if (data.study_visit) {
        condition["inclusion.study_visit.Name"] = data.study_visit;
      }
    }

    console.log("MASS COMM: Process Comm:  processPatientCommunications: Find Matching  comms condition :: ", condition);
    communications = await this.communicationService.findAllByRecurringStatus(condition);

    console.log("MASS COMM: Process Comm: processPatientCommunications: Find Matching comms Found", communications.length);

    // if (_.isEmpty(communications)) {
    //   return;
    // }

    console.log("MASS COMM: Process Comm: ", " processPatientCommunications: Patient Check Patient in pool message sent");

    const patientStatusData = {
      id: patientId,
      patientStatus: data?.patient_old_status ?? null,
      patientStudyVisitStatus: data?.visit_old_status ?? null,
      patientStudyVisitName: data?.study_visit ?? null,
    };

    this.serviceBusUtils.sendMessage(`${process.env.NODE_ENV ?? "local"}_services_communication`, {
      body: {
        type: "patientDataHandler",
        data: {
          event: "check-patient-in-pool",
          data: { communications, patientId, datetime, patientStatusData, isTest },
        },
      },
    });
  }

  /**
   * Processes matching communications for a given patient asynchronously.
   *
   * This function takes in a data object containing matching communications
   * and a patient ID. It iterates over each matching communication,
   * creates notification times based on mass communication criteria,
   * and sends messages to handle mass communication notifications.
   *
   * @async
   * @param {Object} data - Data object containing matchingCommunications and patientId.
   * @param {Array<Object>} data.matchingCommunications - Array of matching communication objects.
   * @param {string} data.patientId - ID of the patient.
   * @returns {Promise<void>}
   */
  public async processMatchingCommunication(data) {
    const matchingMassComms = data.matchingCommunications;
    const patientId = data.patientId;
    const isTest = data.isTest ? data.isTest : false;

    console.log(
      "MASS COMM: Process Comm: ",
      " processMatchingCommunication: In Function ",
      commonUtils.getCurrentLocation(),
      "Matching MassComms: ",
      matchingMassComms.length,
      "patientId: ",
      patientId
    );

    matchingMassComms.forEach(async (massComm) => {
      let isImmediateScenario = false;
      let notificationTimes: any[] = [];
      if (massComm?.frequency_config?.repeat_frequency?.type == RepeatFrequencyType.immediate) {
        let immediateDatetime = moment.utc(data.datetime);
        console.log("ProcessCommunicationService --> processMatchingCommunication --> immediateDatetime ->>", immediateDatetime);
        // Add 5 minutes
        let newImmediateDatetime = immediateDatetime.add(3, "minutes");
        console.log("ProcessCommunicationService --> processMatchingCommunication --> newImmediateDatetime ->>", newImmediateDatetime);
        notificationTimes = [newImmediateDatetime];
        isImmediateScenario = true;
      } else {
        /* Building Notifications - Time Array based on mass comm criteria */
        notificationTimes = await this.createCommunicationNotifications(massComm, data.datetime);
      }

      console.log(
        "MASS COMM: Process Comm: ",
        " processMatchingCommunication: NotificationTimes ",
        commonUtils.getCurrentLocation(),
        "Mass Comm title: ",
        massComm?.title,
        "Change Time/Visit Time: ",
        data.datetime,
        "notificationTimes: ",
        notificationTimes
      );

      const massCommNotifications = {
        massComm,
        notificationTimes,
        patientId,
        isTest,
        isImmediateScenario
      };

      /* TODO: In Patient Manage Service - Handle the below event and add Mass Comm Notifications */
      this.serviceBusUtils.sendMessage(`${process.env.NODE_ENV ?? "local"}_services_communication`, {
        body: {
          type: "patientDataHandler",
          data: {
            event: "patient-event-mass-comm",
            data: massCommNotifications,
          },
        },
      });
    });
  }

  /**
   * Asynchronously creates communication notifications based on the provided data and datetime.
   * These notifications are scheduled according to the mass communication's Interval, Repeat Frequency, and Stop Criteria.
   *
   * @param {CommunicationResponse} data - The data containing communication response information.
   * @param {Date} datetime - The datetime at which the notifications are scheduled.
   * @returns {Promise<void>} A promise representing the completion of notification creation process.
   */
  private async createCommunicationNotifications(data: CommunicationResponse, datetime: Date) {
    console.log("datetime", datetime);
    /* TODO 1.1: Create notifications / schedule all the notifications based on the
          mass comm's Interval, Repeat Frequency and Stop Criteria */

    const comInterval: Interval = data?.frequency_config?.interval ?? {};
    const repeatFrequency: RepeatFrequency = data?.frequency_config?.repeat_frequency ?? {};
    const stopCriteria: RepeatUntil = data?.frequency_config?.repeat_until ?? { type: RepeatUntilType.always };
    const studyVisitType: StudyVisitType | undefined = data?.frequency_config?.study_visit_type;
    const delay: Delay | undefined = data?.frequency_config?.delay;
    const timezone: string = data?.timezone ?? "America/Chicago";

    console.log(
      "MASS COMM: Process Comm: ",
      data?._id.toString(),
      " createCommunicationNotifications: In Function ",
      commonUtils.getCurrentLocation(),
      comInterval,
      repeatFrequency,
      stopCriteria,
      studyVisitType
    );

    // if (_.isEmpty(repeatFrequency)) {
    //   repeatFrequency.type = RepeatFrequencyType.one_time;
    // }
    const scheduledVisitTime = datetime;
    console.log(
      "ProcessCommunicationService --> createCommunicationNotifications --> scheduledVisitTime ->>>>>>>>>>>>>>>>>>>>>>>>>",
      scheduledVisitTime
    );

    let comIntervalType: IntervalType = comInterval?.type ?? IntervalType.same_day;
    let comIntervalDays: string = comInterval?.no_of_days ?? "";
    let comInterval_schedule_type: any = comInterval?.interval_schedule_type ?? "";

    if (!_.isEmpty(data.frequency_config?.delay)) {
      comIntervalType = IntervalType.after;
      comIntervalDays = delay?.duration ?? "";
      comInterval_schedule_type = delay?.type;
    }

    console.log(
      "MASS COMM: Process Comm: ",
      data?._id.toString(),
      " createCommunicationNotifications: Values ",
      commonUtils.getCurrentLocation(),
      "scheduledVisitTime: ",
      scheduledVisitTime,
      "comIntervalType: ",
      comIntervalType,
      "comIntervalDays: ",
      comIntervalDays,
      "timezone",
      timezone
    );

    return await buildNotifications(
      { type: comIntervalType, no_of_days: comIntervalDays, interval_schedule_type: comInterval_schedule_type },
      scheduledVisitTime,
      repeatFrequency,
      stopCriteria,
      timezone
    );
  }

  /**
   * Builds a pool of patients based on the provided criteria.
   * @private
   * @async
   * @param {any} criteria - The criteria used to select patients.
   * @returns {Promise<Patient[]>} A promise that resolves to an array of patients.
   */
  private async buildPatientPool(data: any) {
    console.log("🚀 ~ ProcessCommunicationService ~ buildPatientPool ~ buildPatientPool:data ", data);
    // Fetch patients based on provided criteria
    // From Patient Data Service it will Pass Patients to Com History in Chunk
    const messageResp = await this.serviceBusUtils.sendMessage(`${process.env.NODE_ENV ?? "local"}_services_communication`, {
      body: {
        type: "patientDataHandler",
        data: {
          event: "patient-pool-build",
          "com-data": data,
        },
      },
    });
    console.log(
      "MASS COMM: Process Comm: ",
      data?._id.toString(),
      " buildPatientPool: Building Patient Pool message sent: ",
      commonUtils.getCurrentLocation(),
      data?.title,
      messageResp
    );
  }

  /**
   * Asynchronously processes patient status webhook data.
   *
   * This method handles incoming data from a patient status webhook asynchronously.
   * It invokes the 'processRecurring' method to handle recurring tasks based on the received data.
   *
   * @param {any} data - The data received from the patient status webhook.
   * @returns {Promise<void>} - A Promise that resolves once the data processing is complete.
   */
  public async patientStatusWebhook(data: any) {
    this.processRecurring(data);
  }

  /**
   * Builds a pool of patients based on the provided criteria last communnication.
   * @private
   * @async
   * @param {any} criteria - The criteria used to select patients.
   * @returns {Promise<Patient[]>} A promise that resolves to an array of patients.
   */
  async patientLastComData(data: any) {
    try {
      // Fetch patients based on provided criteria
      // From Patient Data Service it will Pass Patients to Com History in Chunk
      const messageResp = await this.serviceBusUtils.sendMessage(`${process.env.NODE_ENV ?? "local"}_services_communication`, {
        body: {
          type: "patientDataHandler",
          data: {
            event: "patient-last-com-history",
            sendData: data,
          },
        },
      });
      return messageResp;
    } catch (error) {
      throw error;
    }
  }
}
