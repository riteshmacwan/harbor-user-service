import { connectMssqlDb } from "../config/mssql";
import { Department } from "../models";
import { DepartmentBody, DepartmentData, DepartmentDelete } from "../types/department";
type DepartmentCreationResult = DepartmentData | string | null;

/**
 * Represents a repository for managing departments.
 * This class provides methods to perform CRUD (Create, Read, Update, Delete) operations on department data.
 * @class - DepartmentRepository
 */
export class DepartmentRepository {
  /**
   * Asynchronously creates a new department based on the provided data.
   *
   * @async
   * @param {DepartmentBody} data - The data object containing information about the department to be created.
   * @returns {Promise<DepartmentCreationResult>} A Promise that resolves with the result of the department creation operation.
   *                                          If successful, it resolves with the created department data.
   *                                          If the department with the same name already exists, it resolves with an error message.
   *                                          If an error occurs during the operation, it resolves with null.
   */
  async createDepartment(data: DepartmentBody): Promise<DepartmentCreationResult> {
    try {
      let findDepart = await Department.countDocuments({
        name: data.name,
      });

      if (findDepart > 0) {
        return "Name is already exits.";
      }
      let create = (await Department.create(data)) as DepartmentData;
      return create;
    } catch (error) {
      console.log("createScriptCategory error -->", error);
      return null;
    }
  }

  /**
   * Retrieves a list of departments asynchronously from the database.
   *
   * @async
   * @returns {Promise<DepartmentData[] | null>} A promise that resolves to an array of DepartmentData objects if successful, or null if an error occurs.
   * @throws {Error} Throws an error if there's an issue with retrieving department data.
   */
  async listDepartment(): Promise<DepartmentData[] | null> {
    try {
      let data = (await Department.find()) as DepartmentData[];
      return data;
    } catch (error) {
      console.log("createAuditlog error -->", error);
      return null;
    }
  }

  /**
   * Deletes a department from the database.
   * @async
   * @param {DepartmentDelete} data - The data object containing the ID of the department to be deleted.
   * @returns {Promise<DepartmentCreationResult>} A Promise that resolves to a DepartmentCreationResult indicating the outcome of the deletion operation.
   * @throws {Error} If an error occurs during the deletion process.
   * @description This function asynchronously deletes a department from the database based on the provided department ID. It uses the Department model to perform the deletion operation. If the department is successfully deleted, it returns a success message; otherwise, it returns a failure message indicating that the department was not found or not deleted. If an error occurs during the deletion process, it logs the error and returns null.
   */
  async deleteDepartment(data: DepartmentDelete): Promise<DepartmentCreationResult> {
    try {
      const deletedDepartment = await Department.deleteOne({ _id: data._id });

      if (deletedDepartment.deletedCount && deletedDepartment.deletedCount > 0) {
        return "Department deleted successfully";
      } else {
        return "Department not found or not deleted";
      }
    } catch (error) {
      console.error("Error deleting department:", error);
      return null;
    }
  }

  /**
   * Asynchronously updates an existing department in the database.
   * @async
   * @param {DepartmentData} data - The updated department data.
   * @returns {Promise<DepartmentCreationResult>} A Promise that resolves to the updated department data or a descriptive error message.
   * @throws {Error} Throws an error if there's an issue updating the department.
   */
  async updateDepartment(data: DepartmentData): Promise<DepartmentCreationResult> {
    try {
      const updatedDepartment = (await Department.findByIdAndUpdate(data._id, data, { new: true })) as DepartmentData;

      if (updatedDepartment) {
        return updatedDepartment;
      } else {
        return "Department not found or not updated";
      }
    } catch (error) {
      console.error("Error updating department:", error);
      return null;
    }
  }
}
