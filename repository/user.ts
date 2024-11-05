import { User } from "../models/user";
import { UserData } from "../types/user";

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
        user_id,
        profileData
      )) as UserData;
      if (result) {
        return result;
      } else {
        return "User not found or not updated";
      }
    } catch (error) {
      return null;
    }
  }
}
