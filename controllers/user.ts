import { Request, Response } from "express";
import { UserService } from "../service/user";
import { userBody } from "../types/user";
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
  updateUser = async (
    req: Request<{}, {}, userBody>,
    res: Response
  ): Promise<Response> => {
    const profileData = req.body;
    const data = await this.userService.updateUser(
      profileData["user_id"],
      profileData
    );
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
