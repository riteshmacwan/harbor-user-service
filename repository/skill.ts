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
      console.log("SkillRepository -> listSkill error -->", error);
      return null;
    }
  }
  async addNewSkills(skills: any[]): Promise<any> {
    try {
      // Extract the unique skill names to avoid checking them multiple times
      const skillNames = skills.map((skill: any) => skill.name);

      // Find existing skills in bulk using `in` query
      const existingSkills = await Skill.find({ name: { $in: skillNames } });

      // Map existing skills for quick lookup
      const existingSkillsMap = new Set(
        existingSkills.map((skill) => skill.name)
      );

      // Filter out skills that already exist
      const newSkills = skills.filter(
        (skill: any) => !existingSkillsMap.has(skill.name)
      );

      // If there are no new skills, we can return early
      if (newSkills.length === 0) {
        return [];
      }

      // Insert only the new skills into the database
      const addedSkills = await Skill.insertMany(newSkills);

      return addedSkills;
    } catch (error) {
      console.log("SkillRepository -> addNewSkills error -->", error);
      return null;
    }
  }
}
