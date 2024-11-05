import { Document, Model, model, Schema } from "mongoose";
import { PlanBody } from "../types/plan";

type IPlan = PlanBody & Document;
const PlanSchema: Schema<IPlan> = new Schema<IPlan>(
  {
    name: {
      required: true,
      type: String,
    },
    features: {
      required: true,
      type: [String],
    },
    tags: {
      required: true,
      type: [String],
    },
    description: {
      required: true,
      type: String,
    },
    amount: {
      required: true,
      type: Number,
    },

    currency: {
      required: true,
      type: String,
      enum: ["USD", "INR"],
    },
    duration: {
      required: true,
      type: String,
      enum: ["monthly", "yearly"],
    },
  },
  {
    timestamps: true,
  }
);
export const Plan: Model<IPlan> = model<IPlan>("Plans", PlanSchema);
