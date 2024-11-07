import { UserRepository } from "../repository/user";

export class UserService {
  private userRepository: UserRepository;
  constructor() {
    this.userRepository = new UserRepository();
  }
  /**
   * Updates a user's profile data in the repository.
   *
   * @param {string} user_id - The unique identifier of the user to be updated.
   * @param {object} profileData - An object containing the profile fields to be updated.
   * @returns {Promise<UserData | string | null>} A promise that resolves with the updated user data,
   * a message indicating the user was not found or not updated, or null if an error occurs.
   */
  async updateUser(user_id: string, profileData: object) {
    return await this.userRepository.updateUser(user_id, profileData);
  }
}
