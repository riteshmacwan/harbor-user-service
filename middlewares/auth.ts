import { CommonUtils } from "../utils";
import { Response, NextFunction } from "express";
import { UserRequest } from "../types/request";

const commonUtils = CommonUtils.getInstance();

/**
 * Middleware function to verify the validity of a JWT (JSON Web Token) passed in the request headers.
 * If the token is valid, it retrieves the user information from the cache and attaches it to the request object.
 * If the token is invalid or missing, it returns an appropriate error response.
 *
 * @param {UserRequest} req - The request object containing the headers with the JWT.
 * @param {Response} res - The response object used to send HTTP responses.
 * @param {NextFunction} next - The next function to be called in the middleware chain.
 * @returns {Promise<void>} - Promise that resolves once the token verification is complete.
 * @throws {Error} - Throws an error if the token verification process fails.
 */
export const verifyToken = async (req: UserRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1]; // Assuming Bearer token is used
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    const authHeader = req.headers["authorization"];
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring("Bearer ".length).trim();
      const getCache = await commonUtils.getCache(token);
      if (getCache) {
        req.user = JSON.parse(getCache);
        return next();
      } else {
        return res.status(401).json({ error: "Invalid Token Provided." });
      }
    } else {
      return res.status(401).json({ error: "Invalid Token Provided." });
    }
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ error: "Failed to authenticate token" });
  }
};

export default verifyToken;
