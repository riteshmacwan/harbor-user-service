import { Response } from "express";
import { SkillService } from "../service/skill";

export class SkillController {
  private skillService: SkillService;

  constructor() {
    this.skillService = new SkillService();
  }

  /**
   * Retrieves a list of departments.
   * @async
   * @function - listSkill
   * @param {Request} req - The request object (not used in this function).
   * @param {Response} res - The response object.
   * @returns {Promise<Response>} The response containing the list of skills or an error message.
   */
  listSkill = async (req: any, res: any): Promise<Response> => {
    const data = await this.skillService.listSkill();
    return data
      ? res.status(200).json({
          status: true,
          data,
        })
      : res.status(400).json({
          status: false,
          data,
        });
  };
}
