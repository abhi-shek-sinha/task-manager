export type TaskStatus =  'on process' | 'completed' | 'expired';

export interface User {
  _id: string;
  name: string;
  email: string;
  token: string;
}

export interface Task {
  _id: string;
  user: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  dueDate: string;
  status?: TaskStatus;
}