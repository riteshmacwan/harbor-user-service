import { Plan } from "../models/plan";
import { PlanData } from "../types/plan";
/**
 * Represents a repository for managing plans.
 * This class provides methods to perform CRUD (Create, Read, Update, Delete) operations on plan data.
 * @class - PlanRepository
 */
export class PlanRepository {
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
