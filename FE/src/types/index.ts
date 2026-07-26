export interface User {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  isEmailVerified?: boolean;
  createdAt: Date;
}

export interface WorkSpace {
  _id: string;
  name: string;
  description?: string;
  owner: User | string;
  color: string;
  member: {
    user: User;
    role: "admin" | "member" | "viewer" | "owner";
  };
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
