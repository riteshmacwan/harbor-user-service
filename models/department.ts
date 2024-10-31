import { Schema, Document, Model, model } from "mongoose";
import { DepartmentBody } from "../types/department";

/**
 * Interface representing a script category document.
 */
type IDepartment = DepartmentBody & Document;

const DepartmentSchema: Schema<IDepartment> = new Schema<IDepartment>(
  {
    name: {
      required: true,
      type: String,
    },
  },
  {
    /**
     * Disables version key.
     * Specifies the collection name.
     */
    versionKey: false,
    collection: "department",
  }
);

export const Department: Model<IDepartment> = model<IDepartment>("Department", DepartmentSchema);
