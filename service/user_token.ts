import { UserTokenRepository } from "../repository";

/**
 * Service class for managing user tokens.
 * This class provides methods to interact with user tokens stored in a repository.
 */
export class UserTokenService {
  private userTokenRepository: UserTokenRepository;

  /**
   * Creates an instance of UserTokenService.
   * Initializes the user token repository.
   * @constructor
   */
  constructor() {
    this.userTokenRepository = new UserTokenRepository();
  }

  /**
   * Finds a user token by email.
   * Retrieves the user token associated with the given email address.
   * @param {string} email - The email address of the user.
   * @returns {Promise<UserTokenBody | null>} A promise that resolves with the user token object if found, otherwise undefined.
   */
  async findOneByEmail(email: string) {
    return await this.userTokenRepository.findOneByEmail(email);
  }

  async findOneByGroupType() {
    return await this.userTokenRepository.findOneByGroupType();
  }

  async updateOne(id: string, data: any) {
    return await this.userTokenRepository.updateOne(id, data)
  }
}
