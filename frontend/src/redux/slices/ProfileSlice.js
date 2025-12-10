import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from '../../api/axiosInstance';

export const getProfile = createAsyncThunk(
  "profile/getProfile",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/accounts/profile/");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Something went wrong");
    }
  }
);

export const updateProfile = createAsyncThunk(
  "profile/updateProfile",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put("/accounts/profile/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Update failed");
    }
  }
);

export const changePassword = createAsyncThunk(
  "profile/changePassword",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put("/accounts/change-password/", data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Password update failed");
    }
  }
);

const profileSlice = createSlice({
  name: "profile",
  initialState: {
    profile: null,
    loading: false,
    error: null,
    success: null,
  },

  reducers: {
    clearStatus: (state) => {
      state.error = null
      state.success = null
    }
  },

  extraReducers: (builder) => {
    builder

      .addCase(getProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.detail;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.detail;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearStatus } = profileSlice.actions;
export default profileSlice.reducer;
