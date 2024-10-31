import { Request, Response, NextFunction } from "express";
import { check, validationResult, ValidationChain, body } from "express-validator";
const emailRegex = /^[a-zA-Z0-9._%+-]+@dmclinical\.com$/;

/**
 * Represents an item containing validation result information.
 * @interface ValidationResultItem
 * @property {string} msg - A message describing the validation result.
 */
interface ValidationResultItem {
  msg: string;
}

/**
 * Validates the creation of a communication object.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {void}
 */
export const communicationCreate: ValidationChain[] = [
  /**
   * Validates the title field.
   */
  check("title").trim().notEmpty().withMessage("Title is required.").isLength({ max: 150 }).withMessage("Title must not exceed 150 characters."),

  /**
   * Validates the type field.
   */
  check("type").custom((value, { req }) => {
    if (req.body.status === "draft" && !value) {
      return true;
    }
    if (value && !["sms", "email"].includes(value)) {
      throw new Error("Type must be one of the following ['sms', 'email']");
    }
    // Return true to indicate the validation succeeded
    return true;
  }),

  /**
   * Validates the department_id field.
   */
  check("department_id").custom((value, { req }) => {
    if (req.body.status === "draft" && !value) {
      return true;
    } else if (!value) {
      throw new Error("Department ID is required.");
    }

    return true;
  }),

  /**
   * Validates the description field.
   */
  check("description").custom((value, { req }) => {
    if (value && value.length > 500) {
      throw new Error("Description must not exceed 500 characters.");
    }

    if (req.body.status === "draft" && !value) {
      return true;
    } else if (!value) {
      throw new Error("Description is required.");
    }

    return true;
  }),

  /**
   * Validates the status field.
   */
  check("status")
    .isIn(["draft", "pending_review", "discarded","published"])
    .withMessage("Status must be one of the following ['draft', 'pending_review', 'discarded']."),

  /**
   * Validates the referral_source field.
   */
  check("referral_source").optional().isArray().withMessage("Referral source must be an array."),
  check("referral_source.*.id").isInt({ min: 1 }).withMessage("Referral source ID must be a positive integer."),
  check("referral_source.*.name").trim().notEmpty().withMessage("Referral Source Name is required."),

  /**
   * Validates the study field.
   */
  check("study").optional().isObject().withMessage("Study must be an object."),
  check("study.id").optional().isInt({ min: 1 }).withMessage("ID must be a positive integer."),
  check("study.name").optional().trim().notEmpty().withMessage("Study Name is required."),

  /**
   * Validates the frequency field.
   */
  check("frequency").custom((value, { req }) => {
    if (req.body.status === "draft" && !value) {
      return true;
    }
    if (value && !["one_time", "recurring"].includes(value)) {
      throw new Error("Type must be one of the following ['one_time', 'recurring']");
    }
    // Return true to indicate the validation succeeded
    return true;
  }),

  /**
   * Validates the script_content or script_id fields.
   */
  check()
    .custom((value, { req }) => {
      if (req.body.status == "draft" || req.body.status == "pending_review") {
        return true;
      }
      if (!req.body.script_content && !req.body.script_id) {
        throw new Error("Either script content or script ID is required.");
      }
      return true;
    })
    .withMessage("Either script content or script ID is required."),

  /**
   * Validates the script_id field.
   */
  check("script_id").optional().trim().isMongoId().withMessage("Script Id is not valid."),
];

/**
 * Validates the creation of a communication object.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {void}
 */
export const sendMailValidation: ValidationChain[] = [
  /**
   * Validates the type field.
   */
  check("type", "Invalid type").notEmpty().withMessage("Type is required.").isLength({ min: 5, max: 5 }).withMessage("Type must be five.").isIn(["email"]).trim().escape(),

  /**
   * Validates the patient_id field.
   */
  // check("patient_id", "Invalid patient id").notEmpty().withMessage("Patient id is required.").isString().matches(/^\d+$/).withMessage('Patient id must contain only digits').trim().escape(),

  /**
   * Validates the from field.
   */
  check("from", "Invalid from mail address").trim().escape().notEmpty().withMessage("From mail address is required.").isString().isEmail().isLength({ max: 100 }).withMessage("From mail address must be less then 100.").custom((value, { req }) => {
    if (!emailRegex.test(value)) {
      return false;
    }
    return true;
  }).withMessage("Not a valid support email"),

  /**
   * Validates the to field.
   */
  check("to", "Invalid to mail address").notEmpty().withMessage("To mail address is required.").isString().isEmail().isLength({ max: 100 }).withMessage("To mail address must be less then 100.").trim().escape(),

  /**
   * Validates the cc field.
   */
  check("cc", "CC Email must be an array and alteast single element required").optional().isArray({ min: 1 }).trim().escape(),
  check("cc.*", "Invalid cc email address").notEmpty().isString().isEmail().isLength({ max: 100 }).withMessage("CC mail address must be less then 100.").custom((value, { req }) => {
    if (!emailRegex.test(value)) {
      throw new Error("Not a valid support email in cc");
    }
    return true;
  }).withMessage("Not a valid support email in cc").trim().escape(),

  /**
   * Validates the bcc field.
   */
  check("bcc", "BCC Email must be an array and alteast single element required").optional().isArray({ min: 1 }).trim().escape(),
  check("bcc.*", "Invalid bcc email address").notEmpty().isString().isEmail().isLength({ max: 100 }).withMessage("CC mail address must be less then 100.").custom((value, { req }) => {
    if (!emailRegex.test(value)) {
      throw new Error("Not a valid support email in bcc");
    }
    return true;
  }).withMessage("Not a valid support email in bcc").trim().escape(),

  /**
   * Validates the content field.
   */
  check("content", "Invalid content").notEmpty().withMessage("Content is required.").isString().trim().escape(),
  // .matches(/^[a-zA-Z0-9\s\.,!?]+$/).withMessage('Email content must contain only letters, digits, spaces, and common punctuation')

  /**
   * Validates the subject field.
   */
  check("subject", "Invalid subject").notEmpty().withMessage("Subject is required.").isLength({ min: 2, max: 100 }).withMessage("Subject must be in between 2 to 100 characters only.").isString().trim().escape(),
];

/**
 * Validates the creation of a communication object.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {void}
 */
export const sendSMSValidation: ValidationChain[] = [
  /**
   * Validates the type field.
   */
  check("type", "Invalid type").notEmpty().withMessage("Type is required.").isLength({ min: 3, max: 3 }).withMessage("Type must be three characters.").isIn(["sms"]).trim().escape(),

  /**
   * Validates the patient_id field.
   */
  // check("patient_id", "Invalid patient id").notEmpty().withMessage("Patient id is required.").isString().matches(/^\d+$/).withMessage('Patient id must contain only digits').trim().escape(),

  /**
   * Validates the to field.
   */
  // check("to", "Invalid to mobile number").notEmpty().withMessage("To mobile number is required.").isString().matches(/^[0-9]{10}$/).withMessage('Invalid mobile number format').trim().escape(),

  /**
   * Validates the content field.
   */
  check('content', 'Invalid content')
    .if(body('media').not().exists())
    .notEmpty().withMessage("Content is required.").isString().trim().escape(),
  // .matches(/^[a-zA-Z0-9\s\.,!?]+$/).withMessage('Email content must contain only letters, digits, spaces, and common punctuation')

  /**
   * Validates the media field.
   */
  check('media', 'Invalid media')
    .if(body('content').not().exists())
    .notEmpty().isString().isBase64().custom((value, { req }) => {
      // Check if the image data starts with 'data:image'
      if (value.startsWith("data:image")) {
        throw new Error("Not an valid image");
      }
      return true;
    }).withMessage("Not an valid image").trim().escape()

];

/**
 * Validates the creation of a communication object at reply email.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {void}
 */
export const sendReplyMailValidation: ValidationChain[] = [
  /**
   * Validates the type field.
   */
  check("type", "Invalid type").notEmpty().withMessage("Type is required.").isLength({ min: 5, max: 5 }).withMessage("Type must be five.").isIn(["reply"]).trim().escape(),

  /**
   * Validates the com_history_id field.
   */
  check("com_history_id", "Invalid communication history id").notEmpty().withMessage("Communication history id is required.").isString().isMongoId().trim().escape(),

  /**
   * Validates the content field.
   */
  check("content", "Invalid content").notEmpty().withMessage("Content is required.").isString().trim().escape(),
  // .matches(/^[a-zA-Z0-9\s\.,!?]+$/).withMessage('Email content must contain only letters, digits, spaces, and common punctuation')

  /**
   * Validates the cc field.
   */
  check("cc", "CC Email must be an array and alteast single element required").optional().isArray({ min: 1 }).trim().escape(),
  check("cc.*", "Invalid cc email address").notEmpty().isString().isEmail().isLength({ max: 100 }).withMessage("CC mail address must be less then 100.").custom((value, { req }) => {
    if (!emailRegex.test(value)) {
      throw new Error("Not a valid support email in cc");
    }
    return true;
  }).withMessage("Not a valid support email in cc").trim().escape(),

  /**
   * Validates the bcc field.
   */
  check("bcc", "BCC Email must be an array and alteast single element required").optional().isArray({ min: 1 }).trim().escape(),
  check("bcc.*", "Invalid bcc email address").notEmpty().isString().isEmail().isLength({ max: 100 }).withMessage("CC mail address must be less then 100.").custom((value, { req }) => {
    if (!emailRegex.test(value)) {
      throw new Error("Not a valid support email in bcc");
    }
    return true;
  }).withMessage("Not a valid support email in bcc").trim().escape(),
];

/**
 * Validates the image for uploading.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {void}
 */
export const uploadImageValidation : ValidationChain[] = [
  check("image").notEmpty().withMessage("Image is required."),
  check("type").notEmpty().withMessage("Image type is required."),
]

/**
 * Validates the request parameters using express-validator and sends an error response if validation fails.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {import('express').Response | void} Returns a JSON response with error details if validation fails, otherwise passes control to the next middleware.
 */
export const validation = (req: Request, res: Response, next: NextFunction): Response | void => {
  let error: string[] = [];
  const result: ValidationResultItem[] = validationResult(req).array();
  if (!result.length) return next();

  result.forEach((validationResultItem) => {
    error.push(validationResultItem.msg);
  });

  return res.json({
    status: false,
    message: error ? error[0] : "",
    data: {},
    code: 400,
  });
};
