import { Plan } from "../models";
import { PlanData } from "../types/plan";

export class PlanService {
  /**
   * Retrieves a list of plans asynchronously from the database.
   *
   * @async
   * @returns {Promise<PlanData[] | null>} A promise that resolves to an array of PlanData objects if successful, or null if an error occurs.
   * @throws {Error} Throws an error if there's an issue with retrieving plan data.
   */
  async listPlan(): Promise<PlanData[] | null> {
    try {
      let data = (await Plan.find()) as PlanData[];
      return data;
    } catch (error) {
      console.log("createAuditlog error -->", error);
      return null;
    }
  }
}
