import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { Validation } from "../../../middlewares/validations/common";

// Mock express-validator validationResult function
jest.mock("express-validator", () => ({
    validationResult: jest.fn(() => ({ array: jest.fn() })),
}));

describe("Validation middleware", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
        req = {};
        res = {
            json: jest.fn(),
        };
        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should call next if there are no validation errors", () => {
        // Mock validationResult array to be empty
        (validationResult as unknown as jest.Mock).mockReturnValue({ array: jest.fn().mockReturnValue([]) });

        // Call Validation middleware
        Validation(req as Request, res as Response, next);

        // Expect next to have been called
        expect(next).toHaveBeenCalled();

        // Expect res.json not to have been called
        expect(res.json).not.toHaveBeenCalled();
    });

    it("should return validation errors if there are any", () => {
        // Mock validation result array with errors
        (validationResult as unknown as jest.Mock).mockReturnValue({
            array: jest.fn().mockReturnValue([
                { msg: "Error 1" },
                { msg: "Error 2" }
            ])
        });

        // Call Validation middleware
        Validation(req as Request, res as Response, next);

        // Expect next not to have been called
        expect(next).not.toHaveBeenCalled();

        // Expect res.json to have been called with the correct error message
        expect(res.json).toHaveBeenCalledWith({
            status: false,
            message: "Error 1, Error 2",
            data: {},
            code: 200,
        });
    });
});
