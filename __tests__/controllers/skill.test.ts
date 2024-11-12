import { SkillController } from "../../controllers";
let skillController: SkillController;
beforeEach(() => {
  skillController = new SkillController();
});
afterEach(() => {
  jest.clearAllMocks();
});

describe("SkillController", () => {
  describe("[POST] :  /list-skill", () => {
    it("should return a list of skills", async () => {
      const result = await skillController.listSkill({}, {});
      expect(result).toBeDefined();
    });
  });
});
