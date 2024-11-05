/**
 * Represents the body of a skill, typically used for creating or updating skills.
 * @interface SkillBody
 */
export interface SkillBody{
    name:string;
}

export interface SkillData{
    _id:string;
    name:string;
createdAt:Date;
updatedAt:Date;
}