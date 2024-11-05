import { SkillRepository } from "../repository/skill";

export class SkillService {
  private skillRepository: SkillRepository;

  /**
   * Initializes the skill service by creating an instance of the skill repository.
   *
   * @constructor
   */
  constructor() {
    this.skillRepository = new SkillRepository();
  }

  /**
   * Retrieves a list of skills asynchronously from the skill repository.
   *
   * @async
   * @returns {Promise<SkillData[] | null>} A promise that resolves to an array of SkillData objects if successful, or null if an error occurs.
   */
  async listSkill() {
    return await this.skillRepository.listSkill();
  }
}
