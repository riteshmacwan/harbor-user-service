import { Response } from "express";
import { PlanService } from "../service";

export class PlanController {
  private planService: PlanService;
  /**
   * Constructor to initialize the PlanController.
   * It initializes the PlanService and makes it ready to be used by the controller methods.
   */
  constructor() {
    this.planService = new PlanService();
  }

  /**
   * Retrieves a list of plans.
   * @async
   * @function - listPlan
   * @param {Request} req - The request object (not used in this function).
   * @param {Response} res - The response object.
   * @returns {Promise<Response>} The response containing the list of plans or an error message.
   */
  listPlan = async (req: any, res: any): Promise<Response> => {
    const data = await this.planService.listPlan();
    return res.status(200).json({
      status: true,
      data,
    });
  };
}
