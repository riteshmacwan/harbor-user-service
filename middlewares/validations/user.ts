import { check, ValidationChain } from "express-validator";

export const userValidation: ValidationChain[] = [
  check("country_code")
    .optional()
    .isString()
    .withMessage("Country code must be a string"),

  check("phone_number")
    .optional()
    .isString()
    .withMessage("Phone number must be a string"),

  check("apple_id")
    .optional()
    .isString()
    .withMessage("Apple ID must be a string"),

  check("google_id")
    .optional()
    .isString()
    .withMessage("Google ID must be a string"),

  check("first_name")
    .exists({ checkFalsy: true })
    .withMessage("First name is required")
    .isString()
    .withMessage("First name must be a string"),

  check("last_name")
    .exists({ checkFalsy: true })
    .withMessage("Last name is required")
    .isString()
    .withMessage("Last name must be a string"),

  check("is_profile_set")
    .exists()
    .withMessage("is_profile_set is required")
    .isBoolean()
    .withMessage("is_profile_set must be a boolean"),

  check("cv").optional().isString().withMessage("CV must be a string"),

  check("licenses")
    .optional()
    .isArray()
    .withMessage("Licenses must be an array of strings")
    .custom((value) => value.every((item) => typeof item === "string"))
    .withMessage("Each license must be a string"),

  check("company")
    .optional()
    .isString()
    .withMessage("Company must be a string"),

  check("birth_date")
    .exists({ checkFalsy: true })
    .withMessage("Birth date is required")
    .isString()
    .withMessage("Birth date must be a string (consider using a date format)"),

  check("gender")
    .exists({ checkFalsy: true })
    .withMessage("Gender is required")
    .isIn(["Male", "Female", "Other"])
    .withMessage("Gender must be one of Male, Female, or Other"),

  check("email")
    .optional()
    .isEmail()
    .withMessage("Email must be a valid email address"),

  check("location")
    .exists({ checkFalsy: true })
    .withMessage("Location is required")
    .isString()
    .withMessage("Location must be a string"),

  check("skill_ids")
    .exists({ checkFalsy: true })
    .withMessage("Skill IDs are required")
    .isArray()
    .withMessage("Skill IDs must be an array of strings")
    .custom((value) => value.every((item) => typeof item === "string"))
    .withMessage("Each skill ID must be a string"),

  check("about")
    .exists({ checkFalsy: true })
    .withMessage("About is required")
    .isString()
    .withMessage("About must be a string"),

  check("plan_id")
    .exists({ checkFalsy: true })
    .withMessage("Plan ID is required")
    .isString()
    .withMessage("Plan ID must be a string"),
  check("level")
    .notEmpty()
    .withMessage("Level is required")
    .isInt({ min: 1 })
    .withMessage("Level must be a positive integer"),
  check("language")
    .exists({ checkFalsy: true })
    .withMessage("Language is required")
    .custom((value) => {
      const validLanguages = ["English", "Spanish"];
      if (!validLanguages.includes(value)) {
        return false;
      }
      return true;
    }),
];
