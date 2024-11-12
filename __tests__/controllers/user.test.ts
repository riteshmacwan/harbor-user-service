import { UserController } from "../../controllers";
import request from "supertest";
import app from "../..";
let userController: UserController = new UserController();
import { UserBody, UserData } from "../../types/user";
import { UserService } from "../../service";
let userService: UserService = new UserService();
describe("UserController", () => {
  describe("[POST] :  /update-user", () => {
    it("should update a user's profile data and respond with 200", async () => {
      const userData = {
        user_id: "67289b424365e8569fbe6fb",
        first_name: "user_fn",
        last_name: "user_ln",
        email: "user@gmail.com",
        country_code: "+91",
        phone_number: "1234567890",
        birth_date: "12/11/2024",
        is_profile_set: false,
        company: "user_company",
        location: "India",
        gender: "Male",
        about: "user_about",
        plan_id: "besic_plan_id",
        skill_ids: ["skill_1_id", "skill_2_id"],
        level: 1,
        language: "English",
        draft_page_no: 1,
      };

      const response = await request(app)
        .put("/mass-com/update-user")
        .send(userData);
      expect(response.status).toBe(200);
    });
    it("should respond with an error when user_id is not provided", async () => {
      const userData: UserData = {
        user_id: "67289b424365e8569fbe6fb",
        first_name: "user_fn",
        last_name: "user_ln",
        email: "user@gmail.com",
        country_code: "+9",
        phone_number: "234567890",
        birth_date: "11/11/2024",
        is_profile_set: false,
        company: "user_company",
        location: "India",
        gender: "Male",
        about: "user_about",
        plan_id: "besic_plan_id",
        skill_ids: ["skill_1_id", "skill_2_id"],
        level: 1,
        language: "English",
        draft_page_no: 1,
      };
    });
  });
});
