import { Request } from "express";

/**
 * Represents an HTTP request from a user, extending the base `Request` interface.
 * Includes an optional `user` property to hold user-related data.
 * @interface UserRequest
 * @extends {Request}
 */
export interface UserRequest extends Request {
  user?: any; // Add the user property
}

/**
 * Represents a request to update communication, extending the `UserRequest` interface.
 * May include an `id` property for identification and additional properties defined by the generic type `T`.
 * @interface UpdateCommunicationRequest
 * @extends {UserRequest}
 * @template T - The type of additional properties, defaults to an empty object.
 */
export interface UpdateCommunicationRequest<T = {}> extends UserRequest {
  id?: string;
}
