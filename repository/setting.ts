import { Setting } from "../models";
import { SettingBody, SettingListResponse, SettingResponse } from "../types/setting";
/**
 * A repository class for managing settings.
 */
export class SettingRepository {

  /**
   * Finds a setting by its status active.
   * @returns {Promise<SettingListResponse[] | null>} - A promise that resolves with the found setting or null if not found.
   */
  async getActivePhones(): Promise<SettingListResponse[] | null> {
    try {
      const data = await Setting.find({ "is_active": true, "type": "IVR" }) as SettingListResponse[];
      return data;
    } catch (error) {
      console.log("SettingRepository/getActivePhones error -->", error);
      return null;
    }
  }
}
