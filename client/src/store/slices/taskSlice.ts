import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import api from '../../api/axiosInstance';
import type { Task, TaskFormData } from '../../types';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  statusFilter: string;
}

const initialState: TaskState = {
  tasks: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  statusFilter: '',
};

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async ({ search, status }: { search?: string; status?: string } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);

      const response = await api.get<Task[]>(`/tasks?${params.toString()}`);
      return response.data;
    } catch (error: unknown) { const message =
    error instanceof Error ? error.message : 'Failed to fetch tasks';
  return rejectWithValue(message);}
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: TaskFormData, { rejectWithValue }) => {
    try {
      const response = await api.post<Task>('/tasks', taskData);
      return response.data;
    } catch (error: unknown) { const message =
    error instanceof Error ? error.message : 'Failed to create tasks';
  return rejectWithValue(message);}
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, taskData }: { id: string; taskData: Partial<TaskFormData> }, { rejectWithValue }) => {
    try {
      const response = await api.put<Task>(`/tasks/${id}`, taskData);
      return response.data;
    } catch (error: unknown) {
 const message =
    error instanceof Error ? error.message : 'Failed to update tasks';
  return rejectWithValue(message);    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/tasks/${id}`);
      return id;
    } catch (error: unknown) {
 const message =
    error instanceof Error ? error.message : 'Failed to delete tasks';
  return rejectWithValue(message);    }
  }
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<string>) => {
      state.statusFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.tasks.unshift(action.payload);
      })
      .addCase(updateTask.fulfilled, (state, action: PayloadAction<Task>) => {
        const index = state.tasks.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(deleteTask.fulfilled, (state, action: PayloadAction<string>) => {
        state.tasks = state.tasks.filter((t) => t._id !== action.payload);
      });
  },
});

export const { setSearchQuery, setStatusFilter } = taskSlice.actions;
export default taskSlice.reducer;