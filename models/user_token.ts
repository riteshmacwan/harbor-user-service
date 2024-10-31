import { Schema, Document, Model, model } from "mongoose";
import { UserTokenBody } from "../types/user_token";


/**
 * Interface representing a script category document.
 */
type IUserToken = UserTokenBody & Document;

const UserTokenSchema: Schema<IUserToken> = new Schema<IUserToken>(
  {
    email: {
      required: true,
      type: String,
    },
    token: {
      required: true,
      type: String,
    },
    refresh_token: {
      required: false,
      type: String,
    },
    expired_at: {
      required: false,
      type: Number,
    },
    history_id: {
      required: false,
      type: String,
    },
    type: {
      required: true,
      type: String,
      enum: ['gmail', 'group'],
      default: 'gmail'
    }
  },

  {
    /**
     * Disables version key.
     * Specifies the collection name.
     */
    versionKey: false,
    collection: "user_token",
  }
);

export const UserToken: Model<IUserToken> = model<IUserToken>("UserToken", UserTokenSchema);
