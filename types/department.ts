/**
 * Represents the body of a department, typically used for creating or updating departments.
 * @interface DepartmentBody
 */
export interface DepartmentBody {
  name: string;
}

/**
 * Represents the data structure for deleting a department.
 * @interface DepartmentDelete
 */
export interface DepartmentDelete {
  _id?: string;
}

/**
 * Represents the data structure for a department, typically used for fetching or updating departments.
 * @interface DepartmentData
 */
export interface DepartmentData {
  _id: string;
  name: string;
}
