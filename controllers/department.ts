import { Request, Response } from "express";
import { DepartmentService } from "../service/department";
import { DepartmentBody, DepartmentData, DepartmentDelete } from "../types/department";

/**
 * Controller class responsible for handling operations related to departments.
 * This class interacts with the DepartmentService to perform CRUD operations on departments.
 */
export class DepartmentController {
  /**
   * Service responsible for managing department data.
   * @private
   */
  private departmentService: DepartmentService;

  /**
   * Creates an instance of DepartmentController.
   * Initializes the departmentService for interacting with department data.
   * @constructor
   */
  constructor() {
    this.departmentService = new DepartmentService();
  }

  /**
   * Creates a department based on the request body.
   * @async
   * @function - createDepartment
   * @param {Request<{}, {}, DepartmentBody>} req - The request object containing the department data.
   * @param {Response} res - The response object.
   * @returns {Promise<Response>} The response indicating success or failure.
   */
  createDepartment = async (req: Request<{}, {}, DepartmentBody>, res: Response): Promise<Response> => {
    // Create department using the provided data
    const data = await this.departmentService.createDepartment(req.body);
    // Send success response
    return res.status(200).json({
      status: true,
      data: data,
    });
  };

  /**
   * Retrieves a list of departments.
   * @async
   * @function - listDepartment
   * @param {Request} req - The request object (not used in this function).
   * @param {Response} res - The response object.
   * @returns {Promise<Response>} The response containing the list of departments or an error message.
   */
  listDepartment = async (req: Request, res: Response): Promise<Response> => {
    // Create department using the provided data
    const data = await this.departmentService.listDepartment();
    // Send success response
    return res.status(200).json({
      status: true,
      data: data,
    });
  };

  /**
   * Deletes a department based on the provided department ID.
   * @async
   * @function - deleteDepartment
   * @param {Request<{}, {}, DepartmentDelete>} req - The request object containing the department ID in the query.
   * @param {Response} res - The response object.
   * @returns {Promise<Response>} The response indicating success or failure.
   */
  deleteDepartment = async (req: Request<{}, {}, DepartmentDelete>, res: Response): Promise<Response> => {
    // Create department using the provided data
    const data = await this.departmentService.deleteDepartment(req.query);
    // Send success response
    return res.status(200).json({
      status: true,
      data: data,
    });
  };

  /**
   * Updates a department based on the provided data.
   * @async
   * @function - updateDepartment
   * @param {Request<{}, {}, DepartmentData>} req - The request object containing the updated department data.
   * @param {Response} res - The response object.
   * @returns {Promise<Response>} The response indicating success or failure.
   */
  updateDepartment = async (req: Request<{}, {}, DepartmentData>, res: Response): Promise<Response> => {
    // Create department using the provided data
    const data = await this.departmentService.updateDepartment(req.body);
    // Send success response
    return res.status(200).json({
      status: true,
      data: data,
    });
  };
}
