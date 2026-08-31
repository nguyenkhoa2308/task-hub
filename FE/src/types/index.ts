export interface User {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  isEmailVerified?: boolean;
  createdAt: Date;
}

export enum ProjectStatus {
  PLANNING = "PLANNING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ON_HOLD = "ON_HOLD",
  CANCELLED = "CANCELLED",
}

export interface MemberProps {
  _id?: string;
  user: User;
  role: string;
  status?: "active" | "pending";
  joinedAt?: Date;
}

export interface Member {
  user: User;
  role: "admin" | "member" | "viewer" | "owner";
  status?: "active" | "pending";
  joinedAt?: Date;
}

export interface WorkSpace {
  _id: string;
  name: string;
  description?: string;
  owner: User | string;
  color: string;
  members?: Member[] | MemberProps[];
  projects?: Project[];
  allowMembersCreateProjects?: boolean;
  allowMembersInvite?: boolean;
  defaultProjectPrivate?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  _id: string;
  name?: string;
  title?: string;
  description?: string;
  status?: ProjectStatus | string;
  startDate?: string;
  dueDate?: string;
  tags?: string;
  isPrivate?: boolean;
  workspace: string;
  members?: Member[] | MemberProps[];
  createdAt: Date;
  updatedAt: Date;
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}
