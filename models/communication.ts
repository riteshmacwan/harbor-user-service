import { Schema, Document, Model, model } from "mongoose";
import _ from "lodash";
import { CommunicationSchemaTypes, CommunicationType, CommunicationStatus } from "../types/communication";
/**
 * Interface representing a communication document.
 */
type ICommunication = CommunicationSchemaTypes & Document;
const CommunicationSchema: Schema<ICommunication> = new Schema<ICommunication>(
  {
    title: {
      required: true,
      type: String,
    },
    hashtag: [],
    type: {
      enum: Object.values(CommunicationType),
      type: String,
      required: false,
      set: function (value: any) {
        if (_.isEmpty(value)) {
          return null;
        }
        return value;
      },
    },
    department_id: {
      type: Schema.Types.ObjectId, // Use ObjectId type for foreign key
      ref: "Department",
      required: false,
      set: function (value: any) {
        if (_.isEmpty(value)) {
          return null;
        }
        return value;
      },
    },
    status: {
      enum: Object.values(CommunicationStatus),
      type: String,
      default: CommunicationStatus.draft,
    },
    referral_source: {
      type: Schema.Types.Mixed,
    },
    study: {
      type: Schema.Types.Mixed,
    },
    description: {
      type: String,
      required: false,
    },
    sender_config: {
      type: Schema.Types.Mixed,
    },
    frequency: {
      type: String,
    },
    frequency_config: {
      type: Schema.Types.Mixed,
    },
    script_id: {
      type: Schema.Types.ObjectId,
      required: false,
      set: function (value: any) {
        if (_.isEmpty(value)) {
          return null;
        }
        return value;
      },
    },
    script_content: {
      type: String,
    },
    is_pinned: {
      type: Boolean,
      default: false,
    },
    pin_order_time: {
      type: Date,
      required: false,
      default: null,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    approved_on: {
      type: Date,
    },
    approved_by: {
      type: String,
    },
    deleted_on: {
      type: Date,
    },
    deleted_by: {
      type: String,
    },
    inclusion: {
      type: Schema.Types.Mixed,
    },
    exclusion: {
      type: Schema.Types.Mixed,
    },
    created_by: {
      required: false,
      type: String,
    },
    updated_by: {
      required: false,
      type: String,
    },
    token: {
      type: String,
      // unique: true, // Ensures uniqueness
    },
    created_username: {
      type: String,
      required: false,
      default: null,
    },
    timezone: {
      type: String,
      required: true,
      default: "America/Chicago",
    },
    created_on: {
      type: Date,
      default: Date.now,
    },
    updated_on: {
      type: Date,
    },
    filtered_count: {
      type: Number,
      required: false,
      default: 0,
    },
    media: {
      type: Schema.Types.Mixed,
      required: false,
      default: null,
    },
  },
  {
    versionKey: false,
    collection: "communication",
    timestamps: false,
  }
);

// CommunicationSchema.pre<ICommunication>("save", async function (next) {
//   try {
//     if (!this.token) {
//       let prefix: string;
//       if (this.type === "sms") {
//         prefix = 'S';
//       } else if (this.type === "email") {
//         prefix = 'E';
//       } else {
//         prefix = ''; // Default prefix for other types
//       }

//       // Generate the token based on the type
//       const lastCommunication: any = await this.model("Communication").findOne({ token: {$regex:prefix ,$options: 'i'}}).sort({ token: -1 }).exec();
//       let lastToken = lastCommunication ? lastCommunication.token : `${prefix}0000`;
//       console.log("lastToken", lastToken);
//       const numericPart = parseInt(lastToken.slice(1), 10);
//       const newNumericPart = numericPart + 1;
//       const paddedNewNumericPart = newNumericPart.toString().padStart(4, '0');
//       this.token = prefix + paddedNewNumericPart;
//     }
//     next();
//   } catch (error) {
//     console.log("error", error);
//   }
// });

CommunicationSchema.index({ token: -1 });
export const Communication: Model<ICommunication> = model<ICommunication>("Communication", CommunicationSchema);
