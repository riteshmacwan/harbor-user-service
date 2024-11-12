export interface UserBody {
  country_code?: string;
  phone_number?: string;
  apple_id?: string;
  google_id?: string;
  first_name: string;
  last_name: string;
  is_profile_set: boolean;
  profile_photo?: string;
  cv?: string;
  licenses?: string[];
  company?: string;
  birth_date: string;
  gender: string;
  email: string;
  location: string; // may be changed in future
  skill_ids: string[];
  about: string;
  plan_id: string;
  level: number;
  language: string;
  draft_page_no?: number;
}
export interface UserData {
  _id: string;
  country_code?: string;
  phone_number?: string;
  apple_id?: string;
  google_id?: string;
  first_name: string;
  last_name: string;
  is_profile_set: boolean;
  cv?: string;
  licenses?: string[];
  company?: string;
  birth_date: string;
  gender: string;
  email?: string;
  location: string; // may be changed in future
  skill_ids: string[];
  about: string;
  plan_id: string;
  level: number;
  language: string;
  draft_page_no?: number;
  created_at?: number;
  updated_at?: number;
}
