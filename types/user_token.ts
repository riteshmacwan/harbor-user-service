/**
 * Represents the body of a user token, containing user authentication information.
 * @interface
 */
export interface UserTokenBody {
  email: string;
  token: string;
  refresh_token: string;
  expired_at: number;
  history_id: string;
  type: string;
}

export interface UserTokenResponse extends UserTokenBody {
  _id: string;
}
