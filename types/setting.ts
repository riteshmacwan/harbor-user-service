import { Types } from "mongoose";


/**
 * Represents a user or an object type with an email, and name.
 * @interface
 */
export interface DistroSource {
  email: string;  // The email associated with the distro.
  name: string;   // The name of the distro.
}

/**
 * Represents a ivr_option type with an keypad_no,distro.
 * @interface
 */
export interface OptionSource {
  keypad_no: string;     // The unique keypad_no of the ivr_script.
  distro: DistroSource;  // The distro associated with the ivr_script.
}

/**
 * Represents a ivr_script type with an key, message.
 * @interface
 */
export interface ScriptSource {
  key: string;     // The unique key of the ivr_script.
  message: string;  // The message associated with the ivr_script.
}

/**
 * Represents the main content of a setting, including the type, label, phone, is_active,
 * and associated ivr_option, ivr_script.
 * @interface
 */
export interface SettingBody {
  type: string;          // The type of the setting.
  phone: string;          // The phone of the setting.
  is_active: boolean;          // The is_active of the boolean.
  label?: string;        // The label or message of the setting.
  ivr_option?: OptionSource[]; // An array of OptionSource objects associated with the setting.
  ivr_script?: ScriptSource[]; // An array of ScriptSource objects associated with the setting.
}

/**
 * Represents the response structure for a setting list, extending the SettingBody
 * interface to include an additional unique identifier (_id).
 * @interface
 */
export interface SettingListResponse extends SettingBody {
  _id: string;  // The unique identifier of the setting.
}

/**
 * Represents the response structure for a single setting, extending the SettingBody
 * interface to include an additional unique identifier (_id).
 * @interface
 */
export interface SettingResponse extends SettingBody {
  _id: string;  // The unique identifier of the setting.
}
