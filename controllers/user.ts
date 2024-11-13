import { Request, Response } from "express";
import { UserService } from "../service/user";
import { SkillRepository } from "../repository/skill";
/**
 *controller class responsible for handling operations related to users.
 *This class interacts with the UserService to perform CRUD operations on users.
 */
export class UserController {
  /**
   * Service responsible for managing users data.
   * @private
   */
  private userService: UserService;

  /**
   * Constructor for UserController.
   * Instantiates a new UserService, which is responsible for
   * performing CRUD operations on user data.
   * @constructor
   */
  constructor() {
    this.userService = new UserService();
  }
  /**
   * Updates a user's profile data based on the request body
   *@async
   * @param {Request<{},{},userBody>} req - The request object containing the user data to be updated.
   * @param {Response} res - The response object.
   * @returns {Response} - The response object containing the updated user data or an error message.
   */
  updateUser = async (req: any, res: Response): Promise<any> => {
    const profileData = req.body;

    // Parse and categorize skills
    const skillIds = JSON.parse(profileData.skill_ids);
    const [newSkills, existingSkills] = skillIds.reduce(
      (acc: any, skill: any) => {
        if (skill.is_new) {
          acc[0].push(skill); // New skills
        } else if (skill.skill_id) {
          acc[1].push(skill.skill_id); // Existing skills
        }
        return acc;
      },
      [[], []] // Initial values: newSkills and existingSkills arrays
    );

    // Add new skills to DB and merge their _id with existing skills
    if (newSkills.length > 0) {
      const addedSkills = await new SkillRepository().addNewSkills(newSkills);
      const newSkillIds = addedSkills.map((skill: any) => skill._id);
      existingSkills.push(...newSkillIds); // Merge new skill IDs with existing
    }

    // Assign final skill_ids to profile data
    profileData["skill_ids"] = existingSkills;

    // Handle file uploads
    const files = req.files || {};
    if (files?.profile_photo?.[0]) {
      profileData["profile_photo"] = files.profile_photo[0].path;
    }
    if (files?.cv?.[0]) {
      profileData["cv"] = files.cv[0].path;
    }
    if (files?.licenses?.length > 0) {
      profileData.licenses = files.licenses.map((license: any) => license.path);
    }

    // Update user in the service
    const data = await this.userService.updateUser(
      profileData["user_id"],
      profileData
    );

    // Return response based on result
    return data.status
      ? res.status(200).json(data)
      : res.status(400).json(data);
  };
}
