import { Skill } from "../models/skill";
import { SkillData } from "../types/skill";

type SkillCreattionResult = SkillData | string | null;

/**
 * Represents a repository for managing skills.
 * This class provides methods to perform CRUD (Create, Read, Update, Delete) operations on skill data.
 * @class - SkillRepository
 */
export class SkillRepository {
 
  /**
   * Retrieves a list of skills asynchronously from the database.
   *
   * @async
   * @returns {Promise<SkillData[] | null>} A promise that resolves to an array of SkillData objects if successful, or null if an error occurs.
   * @throws {Error} Throws an error if there's an issue with retrieving skill data.
   */
  async listSkill(): Promise<SkillData[] | null> {
    try {
      let data = (await Skill.find()) as SkillData[];
      return data;
    } catch (error) {
      console.log("createAuditlog error -->", error);
      return null;
    }
  }
}
