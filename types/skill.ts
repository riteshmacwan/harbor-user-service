/**
 * Represents the body of a skill, typically used for creating or updating skills.
 * @interface SkillBody
 */
export interface SkillBody {
  name: string;
  is_published: boolean;
}

export interface SkillData {
  _id: string;
  name: string;
  is_published: boolean;
  createdAt: Date;
  updatedAt: Date;
}
