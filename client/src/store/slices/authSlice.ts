import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';

import api from '../../api/axiosInstance';
import type { User } from '../../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

const storedUser = localStorage.getItem('user');
const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  isLoading: false,
  error: null,
};

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: { name: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<User>('/auth/register', userData);
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error: unknown) {
    if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Registration failed');
      }
      return rejectWithValue('Registration failed');
   }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (userData: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<User>('/auth/login', userData);
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error: unknown) {
    if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Login failed');
      }
      return rejectWithValue('Login failed');}
  }
);


// Add to your exports:
export const googleLoginUser = createAsyncThunk(
  'auth/googleLogin',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await api.post<User>('/auth/google', { token });
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
    return rejectWithValue(error.response?.data?.message || 'Google Login failed');
  }
  return rejectWithValue('Google Login failed');}
  }
);

// Add these utility API calls (they don't need to be thunks since they just return messages)
export const sendOtpAPI = async (email: string) => {
  const res = await api.post('/auth/forgot-password/send-otp', { email });
  return res.data;
};

export interface ResetPasswordOtpData {
  email: string;
  otp: string;
  password: string;
}

export const resetPasswordOtpAPI = async (data: ResetPasswordOtpData) => {
  const res = await api.post('/auth/forgot-password/reset', data);
  return res.data;
};



const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      state.user = null;
      state.error = null;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(googleLoginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(googleLoginUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(googleLoginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
