import { SettingRepository } from "../repository";
import { SettingBody, SettingListResponse, SettingResponse } from "../types/setting";
import { CommonUtils } from "../utils";
import axios from "axios";
const twilio = require('twilio');
/**
 * Service class for managing setting.
 * This class provides methods to interact with setting stored in a repository.
 */
export class SettingService {

  /**
   * Utility functions for common operations.
   * @type {CommonUtils}
   * @private
   */
  private commonUtils: CommonUtils;

  private settingRepository: SettingRepository; // Private instance of SettingRepository

  /**
   * Creates an instance of SettingService.
   * Initializes the setting repository.
   * @constructor
   */
  constructor() {
    this.settingRepository = new SettingRepository();
    this.commonUtils = CommonUtils.getInstance();
  }

  /**
   * Retrieves a setting by its status active.
   * @returns {Promise<SettingListResponse[] | null>} - A promise that resolves with the setting or null if an error occurs.
   */
  async getActivePhones(): Promise<SettingListResponse[] | null> {
    try {
      return await this.settingRepository.getActivePhones();
    } catch (error) {
      console.log("SettingService/getActivePhones error -->", error);
      return null;
    }
  }


  async getSenderActivePhone() {
    try {
      const response = await this.getActivePhones();
      console.log("active ivr data ------>", response);

      let stateArray = {
        "+12673769392": "Pennsylvania",
        "+15055941133": "New Mexico",
        "+18302837997": "Texas",
        "+16469418585": "New York",
        "+19452980007": "Texas",
        "+13135131616": "Michigan",
        "+17086161313": "Illinois",
        "+19036003627": "Texas",
        "+18489995778": "New Jersey",
        "+18574109993": "Massachusetts",
        "+16232320800": "Arizona",
        "+14253998006": "Washington",
        "+18336300203": "Texas",
        "+13617333627": "Texas",
        "+13465509559": "Texas",
        "+17752586400": "Nevada",
      }
      let cityArray = {
        "+12673769392": "Philadelphia",
        "+15055941133": "Albuquerque",
        "+18302837997": "San Antonio",
        "+16469418585": "New York",
        "+19452980007": "Dallas",
        "+13135131616": "Detroit",
        "+17086161313": "Chicago",
        "+19036003627": "Texas",
        "+18489995778": "New Jersey",
        "+18574109993": "Boston",
        "+16232320800": "Pheonix",
        "+14253998006": "Seattle",
        "+18336300203": "Texas",
        "+13617333627": "Texas",
        "+13465509559": "Houston",
        "+17752586400": "Reno",
      }
      const formattedData: any = [];
      const environment = process.env.NODE_ENV;

      if (response && response.length) {
        for (const number of response) {
          console.log("number as indivisual in loop  ------>", number);

          // if (environment === 'qa' && number.phone !== '+13617333627') {
          //   continue;
          // }

          // if (environment === 'staging' && number.phone == '+19036003627') {
          //   continue;
          // }

          formattedData.push({
            phone: number.phone,
            state: stateArray[number?.phone],
            city: number.label || cityArray[number?.phone]
          });
        }
        await this.commonUtils.setCache("cachedPhone", formattedData, 86400)

        console.log("formattedData ---->", formattedData);

        return formattedData;
      } else {
        console.log("No any data from setting.....");
      }
      return null;
    } catch (error) {
      console.error("Error getSenderEmail:", error);
      console.log("ERROS", error);
      return null;
    }
  }
}
