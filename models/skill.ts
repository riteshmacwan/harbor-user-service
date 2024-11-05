import { model, Model, Schema } from "mongoose";
import { SkillBody } from "../types/skill";

/**
 * Interface representing a script category document.
 */
type ISkill = SkillBody & Document;

const SkillSchema = new Schema<ISkill>(
  {
    name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
export const Skill: Model<ISkill> = model<ISkill>("Skills", SkillSchema);
