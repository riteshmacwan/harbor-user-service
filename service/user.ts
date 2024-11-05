import { UserRepository } from "../repository/user";

export class UserService {
  private userRepository: UserRepository;
  constructor() {
    this.userRepository = new UserRepository();
  }
  async updateUser(user_id: string, profileData: object) {
    return await this.userRepository.updateUser(user_id, profileData);
  }
}
