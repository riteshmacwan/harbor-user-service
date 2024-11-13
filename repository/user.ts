import { User } from "../models/user";
import user from "../routes/user";
import { UserData } from "../types/user";
/**
 * Represents a repository for managing users.
 * This class provides methods to perform CRUD (Create, Read, Update, Delete) operations on user data.
 * @class - UserRepository
 */
export class UserRepository {
  /**
   * Asynchronously updates a User document by its ID with the provided data.
   *
   * @param {string} user_id - The unique identifier of the User document to be updated.
   * @param {Object} profileData - An object containing the fields to be updated in the User document.
   * @returns {Promise<UserData | string | null>} - A promise that resolves to the updated User document,
   *                                   or a string indicating the user was not found or not updated,
   *                                   or `null` if an error occurs.
   */
  async updateUser(user_id: string, profileData: object) {
    try {
      let result = (await User.findByIdAndUpdate(
        user_id.toString(),
        profileData
      )) as UserData;
      if (result) {
        return {
          status: true,
          message: "User updated successfully",
          data: result,
        };
      } else {
        return {
          status: false,
          message: "User not found or not updated",
        };
      }
    } catch (error) {
      console.log("UserRepository/updateUser error -->", error);
      return {
        status: false,
        message: "something went wrong",
        error,
      };
    }
  }
  async getOneUser() {
    try {
      const user = await User.findOne();
      return user;
    } catch (error) {
      console.log("UserRepository/getOneUser error -->", error);
    }
  }
}
