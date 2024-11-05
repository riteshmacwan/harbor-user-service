import { Response } from "express";
import { PlanService } from "../service";

export class PlanController {
  private planService: PlanService;
  constructor() {
    this.planService = new PlanService();
  }

  listPlan = async (req: any, res: any): Promise<Response> => {
    const data = await this.planService.listPlan();
    return res.status(200).json({
      status: true,
      data,
    });
  };
}
