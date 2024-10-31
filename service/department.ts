import { DepartmentRepository } from "../repository";
import { DepartmentBody, DepartmentData, DepartmentDelete } from "../types/department";

/**
 * Service class for managing departments.
 * @class
 */
export class DepartmentService {
  /**
   * @private
   */
  private departmentRepository: DepartmentRepository;

  /**
   * Creates an instance of DepartmentService.
   * @constructor
   */
  constructor() {
    this.departmentRepository = new DepartmentRepository();
  }

  /**
   * Creates a new department.
   * @async
   * @param {DepartmentBody} data - The data of the department to be created.
   * @returns {Promise<DepartmentCreationResult>} A Promise that resolves when the department is created.
   */
  async createDepartment(data: DepartmentBody) {
    return await this.departmentRepository.createDepartment(data);
  }

  /**
   * Lists all departments.
   * @async
   * @returns {Promise<DepartmentData[]|null>} A Promise that resolves with a list of all departments.
   */
  async listDepartment() {
    return await this.departmentRepository.listDepartment();
  }

  /**
   * Deletes a department.
   * @async
   * @param {DepartmentDelete} data - The data specifying the department to be deleted.
   * @returns {Promise<DepartmentCreationResult>} A Promise that resolves when the department is deleted.
   */
  async deleteDepartment(data: DepartmentDelete) {
    return await this.departmentRepository.deleteDepartment(data);
  }

  /**
   * Updates an existing department.
   * @async
   * @param {DepartmentData} data - The data specifying the department to be updated.
   * @returns {Promise<DepartmentCreationResult>} A Promise that resolves when the department is updated.
   */
  async updateDepartment(data: DepartmentData) {
    return await this.departmentRepository.updateDepartment(data);
  }
}
