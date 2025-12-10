import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";

export const forgotPasswordSendOtp = createAsyncThunk(
  "forgotPassword/sendOtp",
  async (email, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "accounts/forgot-password/send-otp/",
        { email }
      );
      return { ...response.data, email: email };
    } catch (error) {
      if (error.response) return rejectWithValue(error.response.data);
      return rejectWithValue({ error: error.message });
    }
  }
);

export const forgotPasswordVerifyOtp = createAsyncThunk(
  "forgotPassword/verifyOtp",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "accounts/forgot-password/verify-otp/",
        { email, otp }
      );
      return response.data;
    } catch (error) {
      if (error.response) return rejectWithValue(error.response.data);
      return rejectWithValue({ error: error.message });
    }
  }
);

export const forgotPasswordReset = createAsyncThunk(
  "forgotPassword/reset",
  async ({ email, new_password }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "accounts/forgot-password/reset/",
        { email, new_password }
      );
      return response.data;
    } catch (error) {
      if (error.response) return rejectWithValue(error.response.data);
      return rejectWithValue({ error: error.message });
    }
  }
);

const initialState = {
  email: null,
  otpSent: false,
  otpVerified: false,
  loading: false,
  error: null,
};

const forgotPasswordSlice = createSlice({
  name: "forgotPassword",
  initialState,
  reducers: {
    clearForgot: (state) => {
      state.email = null;
      state.otpSent = false;
      state.otpVerified = false;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(forgotPasswordSendOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPasswordSendOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.otpSent = true;
        state.email = action.payload.email; 
      })
      .addCase(forgotPasswordSendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { error: "Failed to send OTP" };
      })

      .addCase(forgotPasswordVerifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPasswordVerifyOtp.fulfilled, (state) => {
        state.loading = false;
        state.otpVerified = true;
      })
      .addCase(forgotPasswordVerifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { error: "Invalid OTP" };
      })

      .addCase(forgotPasswordReset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPasswordReset.fulfilled, (state) => {
        state.loading = false;

        state.email = null;
        state.otpSent = false;
        state.otpVerified = false;
        state.error = null;
      })
      .addCase(forgotPasswordReset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { error: "Reset failed" };
      });
  },
});

export const { clearForgot } = forgotPasswordSlice.actions;
export default forgotPasswordSlice.reducer;
