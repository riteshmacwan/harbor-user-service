import { Types } from "mongoose";
import _ from "lodash";
import { Communication } from "../models";
import {
  CommunicationData,
  CommunicationResponse,
  PaginationObject
} from "../types/communication";

/**
 * Repository for managing communication-related data.
 * This class provides methods for interacting with communication data,
 * such as sending messages, retrieving conversations, and managing contacts.
 *
 * @class CommunicationRepository
 */
export class CommunicationRepository {
  /**
   * Asynchronously creates a new communication record based on the provided data.
   *
   * @async
   * @param {CommunicationData} data - The data object containing information for creating the communication record.
   * @returns {Promise<CommunicationResponse | null>} A Promise that resolves with the created CommunicationResponse object or null if an error occurs.
   */
  async createOne(data: CommunicationData): Promise<CommunicationResponse | null> {
    try {
      // save script model
      let create = (await Communication.create(data)) as CommunicationResponse;
      return create;
    } catch (error: any) {
      console.log("CommunicationRepository/Create Error -->", error?.message);
      return null;
    }
  }

  /**
   * Asynchronously updates a communication record in the database.
   *
   * @async
   * @param {string} id - The unique identifier of the communication record to update.
   * @param {any} data - The updated data to be saved.
   * @returns {Promise<CommunicationResponse | null>} A promise that resolves with the updated communication record or null if an error occurs.
   * @throws {Error} - Throws an error if the update operation fails.
   */
  async updateOne(id: string, data: any): Promise<CommunicationResponse | null> {
    try {
      // save script model
      let update = (await Communication.findOneAndUpdate({ _id: id }, data, {
        new: true,
      })) as CommunicationResponse;
      return update;
    } catch (error: any) {
      console.log("CommunicationRepository/Update Error -->", error?.message);
      return null;
    }
  }

  /**
   * Retrieves a list of communications with optional filtering, sorting, and pagination.
   *
   * @async
   * @param {number} skip - The number of documents to skip for pagination.
   * @param {number} limit - The maximum number of documents to return.
   * @param {Object} [condition={}] - Optional conditions to filter the communications.
   * @returns {Promise<Array<Object>>} A promise that resolves to an array of communication objects.
   */
  async list(skip: number, limit: number, condition: object = {}): Promise<any[]> {
    try {
      // find script data with pinned on top and with pagination skip and limit
      let data = await Communication.aggregate([
        // join Script Category collection
        {
          $lookup: {
            from: "department",
            localField: "department_id",
            foreignField: "_id",
            as: "department",
          },
        },
        // convert array of script category to object
        {
          $unwind: {
            path: "$department",
            preserveNullAndEmptyArrays: true, // This preserves documents that do not match from the left collection
          },
        },
        // filter
        {
          $match: condition,
        },
        {
          $sort: { is_pinned: -1, pin_order_time: -1, created_on: -1 },
        },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limit }],
            total: [
              {
                $count: "count",
              },
            ],
          },
        },
      ]);
      return data;
    } catch (error: any) {
      console.log("CommunicationRepository/List Error -->", error?.message);
      return [];
    }
  }

  /**
   * Retrieves a list of communications with optional filtering, sorting, and pagination.
   *
   * @async
   * @param {number} skip - The number of documents to skip for pagination.
   * @param {number} limit - The maximum number of documents to return.
   * @param {Object} [condition={}] - Optional conditions to filter the communications.
   * @returns {Promise<Array<Object>>} A promise that resolves to an array of communication objects.
   */
  async new_list(pagination: PaginationObject, condition: object = {}, sorted: [] | undefined = []): Promise<any[]> {
    try {
      // Merge your old query with the dynamic one
      let pipeline: any = [
        // Join Script Category collection (lookup)
        {
          $lookup: {
            from: "department",
            localField: "department_id",
            foreignField: "_id",
            as: "department"
          }
        },
        // Convert array of script category to object (unwind)
        {
          $unwind: {
            path: "$department",
            preserveNullAndEmptyArrays: true // Preserves docs without matching departments
          }
        },
      ];

      // Dynamic filtering based on the matchQuery built from payload
      if (!_.isEmpty(condition)) {
        pipeline.push({ $match: condition });
      }

      // Default sorting plus additional sorting from payload
      if (!_.isEmpty(sorted)) {
        // Sorting from payload if 'sorting' exists
        pipeline.push({ $sort: { ...sorted } });
      } else {
        pipeline.push({
          $sort: {
            is_pinned: -1, // Add default sortings after payload sorts
            pin_order_time: -1,
            created_on: -1
          }
        });
      }

      // Pagination using $facet to return data and count
      pipeline.push({
        $facet: {
          data: [{ $skip: pagination.skip }, { $limit: pagination.limit }], // Pagination
          total: [{ $count: "count" }] // Count total records
        }
      });

      // find script data with pinned on top and with pagination skip and limit
      console.log("pipeline======>", JSON.stringify(pipeline));
      let data = await Communication.aggregate(pipeline as []);
      return data;
    } catch (error: any) {
      console.log("CommunicationRepository/List Error -->", error?.message);
      return [];
    }
  }

  /**
   * Asynchronously counts the number of documents in the Communication collection that match the given condition.
   *
   * This function queries the Communication collection to count the documents that satisfy the provided condition.
   *
   * @param {object} [condition={}] The optional condition to filter documents. Defaults to an empty object.
   * @returns {Promise<number>} A Promise that resolves with the count of documents matching the condition.
   *                            If an error occurs during the operation, resolves with 0.
   * @throws {Error} - If an unexpected error occurs during the operation.
   */
  async countDocument(condition: object = {}): Promise<number> {
    try {
      let count = await Communication.countDocuments(condition);
      return count;
    } catch (error: any) {
      console.log("CommunicationRepository/countDocument Error -->", error?.message);
      return 0;
    }
  }

  /**
   * Asynchronously finds and returns a document from the Communication collection that matches the given condition,
   * sorting by the token field in descending order.
   *
   * This function queries the Communication collection to find a single document that satisfies the provided condition,
   * sorting by token in descending order.
   *
   * @param {object} [condition={}] The optional condition to filter documents. Defaults to an empty object.
   * @returns {Promise<any>} A Promise that resolves with the found document or null if not found.
   *                         If an error occurs during the operation, resolves with null.
   * @throws {Error} - If an unexpected error occurs during the operation.
   */
  async findOne(condition: object = {}): Promise<any> {
    try {
      return await Communication.findOne(condition)
        .sort({ token: -1 })
        .exec();
    } catch (error: any) {
      console.log("CommunicationRepository/findOne Error -->", error?.message);
      return null;
    }
  }

  /**
   * Asynchronously finds a communication entry by its unique identifier.
   *
   * This method aggregates communication data, including joining with the department collection,
   * based on the provided `id`. It returns a single CommunicationResponse object or null if not found.
   *
   * @async
   * @param {string} id - The unique identifier of the communication entry.
   * @returns {Promise<CommunicationResponse | null>} A Promise that resolves to the found communication entry
   * or null if not found.
   */
  async findOneById(id: string): Promise<CommunicationResponse | null> {
    try {
      const data = await Communication.aggregate([
        // join Script Category collection
        {
          $lookup: {
            from: "department",
            localField: "department_id",
            foreignField: "_id",
            as: "department",
          },
        },
        // convert array of script category to object
        {
          $unwind: {
            path: "$department",
            preserveNullAndEmptyArrays: true, // This preserves documents that do not match from the left collection
          },
        },
        { $match: { _id: new Types.ObjectId(id) } },
      ]);
      return data[0];
    } catch (error: any) {
      console.log("CommunicationRepository/findOneById Error -->", error?.message);
      return null;
    }
  }

  /**
   * Asynchronously retrieves all communications based on the provided recurring status condition.
   *
   * @async
   * @param {object} [condition={}] The condition object to filter communications by recurring status.
   * @returns {Promise<CommunicationResponse[]|[]>} A Promise that resolves to an array of CommunicationResponse objects
   * if communications are found based on the provided condition; otherwise, an empty array.
   * @throws {Error} - If an error occurs during the retrieval process.
   */
  async findAllByRecurringStatus(condition: object = {}): Promise<CommunicationResponse[] | []> {
    try {
      let data = (await Communication.find(condition)) as CommunicationResponse[];
      return data;
    } catch (error: any) {
      console.log("CommunicationRepository/findOneById Error -->", error?.message);
      return [];
    }
  }
}
