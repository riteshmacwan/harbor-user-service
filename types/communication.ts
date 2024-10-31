import { Types } from "mongoose";

/**
 * Represents the response of communication validation.
 * This interface defines the structure of the response object returned
 * after validating communication status.
 */
export interface CommunicationValidationResponse {
  status: boolean;
  message?: string;
}

/**
 * Represents the schema for communication data.
 * Communication entities are used for managing various forms of communication within an application.
 * This interface defines the structure and properties of such communication entities.
 */
export interface CommunicationSchemaTypes {
  title: string;
  token?: string;
  type: CommunicationType | null;
  department_id: Types.ObjectId | null;
  status?: CommunicationStatus;
  referral_source?: ReferralSource[] | null;
  study?: Study | null;
  description: string | null;
  sender_config: SenderConfig | null;
  frequency: FrequencyType | null;
  frequency_config: FrequencyConfig | null;
  script_id: Types.ObjectId;
  script_content?: string | null;
  is_pinned?: boolean;
  pin_order_time?: Date | null;
  is_active?: boolean;
  approved_on?: Date | null;
  approved_by?: string | null;
  deleted_on?: Date | null;
  deleted_by?: string | null;
  created_by?: string | null;
  created_username?: string | null;
  updated_by?: string | null;
  inclusion?: InclusionExclusion | null;
  exclusion?: InclusionExclusion | null;
  timezone: string;
  hashtag?: [Types.ObjectId];
  created_on?: Date | null;
  updated_on?: Date | null;
  filtered_count?: number;
  media?: any;
}

/**
 * Represents communication data with optional properties.
 * This interface extends CommunicationSchemaTypes to incorporate additional optional properties.
 * @interface
 * @extends {CommunicationSchemaTypes}
 */
export interface CommunicationData extends CommunicationSchemaTypes {
  id?: string;
  created_by?: string | null;
}
/**
 * Represents the data required to create a communication.
 * @interface
 * @extends {CommunicationData}
 */
export interface CommunicationCreate extends CommunicationData {
  user?: string;
}

/**
 * Represents the response structure for a communication.
 * @interface
 * @extends {CommunicationSchemaTypes}
 */
export interface CommunicationResponse extends CommunicationSchemaTypes {
  _id: string;
}

/**
 * Represents a change in the status of communication.
 * @interface
 */
export interface CommunicationChangeStatus {
  id: string;
  status: CommunicationStatus;
  user: string;
  created_username: string;
  script_content?: string;
}

/**
 * Enum representing communication types.
 * @readonly
 * @enum {string}
 */
export enum CommunicationType {
  sms = "sms",
  email = "email",
}

/**
 * Enum representing communication statuses.
 * @readonly
 * @enum {string}
 */
export enum CommunicationStatus {
  draft = "draft",
  pending_review = "pending_review",
  published = "published",
  discarded = "discarded",
  decline = "decline",
  restore = "restore",
  deleted = "deleted",
}

/**
 * Represents a referral source.
 * @interface ReferralSource
 */
interface ReferralSource {
  id?: number;
  name?: string;
}

/**
 * Represents a study.
 * @interface Study
 */
interface Study {
  id?: number;
  name?: string;
}

/**
 * Configuration options for a message sender.
 *
 * @interface SenderConfig
 */
export interface SenderConfig {
  sender_phone?: number;
  sender_email?: string;
  reply_email?: string;
  cc?: string[];
  bcc?: string[];
}

/**
 * Enum representing the type of frequency for a message or event.
 *
 * @enum {string}
 */
export enum FrequencyType {
  one_time = "one_time",
  recurring = "recurring",
}

/**
 * Represents the configuration for scheduling recurring events.
 * @interface
 */
export interface FrequencyConfig {
  type: FrequencyConfigType;
  scheduled_time?: Date;
  start_date?: Date;
  interval?: Interval;
  study_visit_type?: StudyVisitType;
  repeat_frequency?: RepeatFrequency;
  delay?: Delay;
  repeat_until?: RepeatUntil;
}

/**
 * Enum representing different types of frequency configurations.
 * @enum {string}
 */
export enum FrequencyConfigType {
  now = "now",
  scheduled = "scheduled",
  status_change = "status_change",
  study_visit = "study_visit",
}

/**
 * Enum representing different types of study visits.
 * @enum {string}
 */
export enum StudyVisitType {
  scheduled_visit = "scheduled_visit",
  completed_visit = "completed_visit",
}

/**
 * Represents an interval for scheduling purposes.
 * @interface Interval
 */
export interface Interval {
  type?: IntervalType;
  interval_schedule_type?: IntervalScheduleType;
  no_of_days?: string;
}

/**
 * Enum for different types of intervals.
 *
 * @enum {string}
 */
export enum IntervalType {
  same_day = "same_day",
  before = "before",
  after = "after",
}

/**
 * Enum representing types of intervals for scheduling.
 * @readonly
 * @enum {string}
 */
export enum IntervalScheduleType {
  days = "days",
  hours = "hours",
  minutes = "minutes",
}

/**
 * Represents the frequency of repetition for a scheduled event.
 * @interface
 */
export interface RepeatFrequency {
  type?: RepeatFrequencyType;
  schedule_time?: RepeatFrequencyTimes[];
}

/**
 * Enum representing different types of repetition frequencies.
 * @enum {string}
 */
export enum RepeatFrequencyType {
  one_time = "one_time",
  daily = "daily",
  weekly = "weekly",
  monthly = "monthly",
  immediate = "immediate",
}

/**
 * Interface representing the frequency and times for repeating an action.
 * @interface RepeatFrequencyTimes
 */
export interface RepeatFrequencyTimes {
  day?: string;
  date?: Date;
  times?: string[];
}

/**
 * Interface representing the delay configuration for an action.
 * @interface Delay
 */
export interface Delay {
  type?: DelayType;
  duration?: string;
}

/**
 * Enum representing different types of delays.
 */
export enum DelayType {
  minutes = "minutes",
  hours = "hours",
  days = "days",
}

/**
 * Interface representing repeat until condition.
 */
export interface RepeatUntil {
  type?: RepeatUntilType;
  duration?: string;
  end_date?: Date;
}

/**
 * Enum representing different types of repeat until conditions.
 * @enum {string}
 * @readonly
 */
export enum RepeatUntilType {
  date = "date",
  no_of_times = "no_of_times",
  always = "always",
  days = "days",
  weeks = "weeks",
  months = "months",
}

/**
 * Enum representing different types of visit conditions.
 * @enum {string}
 * @readonly
 */
export enum VisitType {
  on_after = "on_after",
  between = "between",
}

/**
 * Represents a visit date with optional type and start/end dates.
 * @interface VisitDate
 */
export interface VisitDate {
  type?: VisitType;
  date?: Date;
  end_date?: Date;
}

/**
 * Represents an age range with a start and end age.
 * @interface Age
 */
export interface Age {
  start: number;
  end: number;
}

/**
 * Enum representing different types of vaccines.
 * @readonly
 * @enum {string}
 */
export enum VaccineType {
  type_of_vaccine = "type_of_vaccine",
  days_since_vaccine = "days_since_vaccine",
}

/**
 * Interface representing vaccine history.
 * @interface
 */
export interface VaccineHistory {
  type?: VaccineType;
  type_of_vaccine: number[];
  days_since_vaccine: number;
}

/**
 * Represents criteria for inclusion or exclusion in a study.
 * @interface
 */
export interface InclusionExclusion {
  status?: ArrayObject[];
  sub_status?: ArrayObject[];
  confirmation_status?: string[];
  campaign_name?: ArrayObject[];
  referral_source?: ArrayObject[];
  study?: ArrayObject;
  study_visit?: ArrayObject[];
  last_visit_name?: ArrayObject[];
  last_visit_date?: VisitDate;
  next_visit_name?: ArrayObject;
  next_visit_date?: VisitDate;
  patient_created_on?: VisitDate;
  state?: ArrayObject[];
  site?: ArrayObject[];
  indications?: ArrayObject[];
  gender?: string[];
  age?: Age;
  language?: ArrayObject[];
  transportations?: ArrayObject[];
  vaccine_history?: VaccineHistory;
}

/**
 * Represents an object with an Id and Name.
 * @interface ArrayObject
 */
export interface ArrayObject {
  Id: number;
  Name: string;
}

/**
 * Represents a notification schedule.
 * @interface NotificationSchedule
 */
export interface NotificationSchedule {
  notifications: string[];
}

export interface PaginationObject {
  skip: number,
  limit: number
}

export interface SortByArray {
  name: string,
  direction: number
}