export interface JwtPayload {
  id: number;
  username: string;
  expiration?: Date;
}
