import { Schema, Document, Model, model } from "mongoose";
import _ from "lodash";
import { SettingBody } from "../types/setting";

/**
 * Interface representing a setting document.
 */
type ISetting = SettingBody & Document;

const SettingSchema: Schema<ISetting> = new Schema<ISetting>(
  {
    type: {
      required: true,
      type: String,
      default: "IVR",
    },
    phone: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: false,
    },
    ivr_option: {
      type: [{
        keypad_no: { type: Number, required: true, },
        distro: {
          type: {
            email: { type: String, required: true, },
            name: { type: String, required: true, }
          }, required: true,
        },
      }],
      required: false,
      set: function (value: any) {
        if (_.isEmpty(value)) {
          return [];
        }
        return value;
      },
    },
    ivr_script: {
      type: [{
        key: { type: String, required: true, },
        message: { type: String, required: true, },
      }],
      required: false,
      set: function (value: any) {
        if (_.isEmpty(value)) {
          return [];
        }
        return value;
      },
    },
    is_active: {
      required: true,
      type: Boolean,
      default: false
    },
  },
  {
    versionKey: false,
    collection: "setting",
    timestamps: {
      createdAt: "created_on",
      updatedAt: "updated_on",
    },
  }
);

SettingSchema.index({ created_on: -1 });
export const Setting: Model<ISetting> = model<ISetting>("Setting", SettingSchema);
