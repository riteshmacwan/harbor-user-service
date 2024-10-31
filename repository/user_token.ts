import { UserToken } from "../models";
import { UserTokenResponse } from "../types/user_token";

/**
 * Repository class for managing user tokens.
 */
export class UserTokenRepository {
  /**
   * Finds a user token by email.
   * @param {string} email - The email of the user.
   * @returns {Promise<UserTokenBody | null>} A Promise that resolves with the found user token or null if not found.
   */
  async findOneByEmail(email: string): Promise<UserTokenResponse | null> {
    try {
      const data: UserTokenResponse | null = await UserToken.findOne({ email: email });
      return data;
    } catch (error: any) {
      console.log("UserTokenRepository/findOneByEmail error -->", error);
      return null;
    }
  }

  async findOneByGroupType(): Promise<UserTokenResponse | null> {
    try {
      const data: UserTokenResponse | null = await UserToken.findOne({ type: "group" });
      return data;
    } catch (error: any) {
      console.log("UserTokenRepository/findOneByEmail error -->", error);
      return null;
    }
  }

  /**
   * Asynchronously updates a UserToken document by its ID with the provided data.
   *
   * @param {string} id - The unique identifier of the UserToken document to be updated.
   * @param {Object} data - An object containing the fields to be updated in the UserToken document.
   * @returns {Promise<UserTokenBody|null>} - A promise that resolves to the updated UserToken document,
   *                                   or `null` if an error occurs.
   */
  async updateOne(id: string, data: any): Promise<UserTokenResponse | null> {
    try {
      let update: UserTokenResponse | null = await UserToken.findOneAndUpdate({ _id: id }, data, {
        new: true,
      });
      return update;
    } catch (error) {
      console.log("UserTokenRepository/updateOne error -->", error);
      return null;
    }
  }
}
