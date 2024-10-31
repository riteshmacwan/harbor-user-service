import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

/**
 * Validates the request using the provided validation rules and returns any errors.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {import('express').Response} The Express response object.
 */
export const Validation = (req: Request, res: Response, next: NextFunction) => {
  let error: any = [];
  const result = validationResult(req).array();
  if (!result.length) return next();

  result.map(async (validationResultItem, index) => {
    error.push(validationResultItem.msg);
  });

  return res.json({
    status: false,
    message: error.join(", "),
    data: {},
    code: 200,
  });
};
