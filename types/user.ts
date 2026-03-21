export const USER_ROLES = ["consumer", "dealer", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
  isActive: boolean;
}

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}
