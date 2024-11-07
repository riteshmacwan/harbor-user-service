import { Document, model, Model, Schema } from "mongoose";
import { userBody } from "../types/user";
/**
 * Interface representing a user document.
 */
type IUser = userBody & Document;

const UserSchema: Schema<IUser> = new Schema<IUser>(
  {
    country_code: {
      required: false,
      type: String,
    },
    phone_number: {
      required: false,
      type: String,
    },
    apple_id: {
      required: false,
      type: String,
    },
    google_id: {
      required: false,
      type: String,
    },
    first_name: {
      required: true,
      type: String,
    },
    last_name: {
      required: true,
      type: String,
    },
    is_profile_set: {
      required: true,
      type: Boolean,
      default: false,
    },
    cv: {
      required: false,
      type: String,
    },
    licenses: {
      required: false,
      type: [String],
    },
    company: {
      required: false,
      type: String,
    },
    birth_date: {
      required: true,
      type: String,
    },
    gender: {
      required: true,
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    email: { type: String, required: false, unique: true },
    location: {
      type: "String",
      required: true,
    },
    skill_ids: {
      required: true,
      type: [String],
    },
    about: {
      type: String,
      required: true,
    },
    plan_id: {
      required: true,
      type: String,
    },
    level: {
      required: true,
      type: Number,
    },
    language: {
      required: true,
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
export const User: Model<IUser> = model<IUser>("Users", UserSchema);
