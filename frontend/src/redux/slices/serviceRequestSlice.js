import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";


export const createServiceRequest = createAsyncThunk(
  'serviceRequest/create',
  async (requestData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('service-request/create/', requestData);
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);

export const fetchNearbyWorkshops = createAsyncThunk(
  'serviceRequest/fetchNearby',
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`service-request/${requestId}/nearby/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch workshops");
    }
  }
);

export const fetchUserRequests = createAsyncThunk(
  'serviceRequest/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('service-request/my-requests/');
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch history");
    }
  }
);

const serviceRequestSlice = createSlice({
  name: 'serviceRequest',
  initialState: {
    requests : [],
    currentRequest: null,
    nearbyWorkshops: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearRequestError: (state) => { state.error = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createServiceRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createServiceRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRequest = action.payload.request;
        state.nearbyWorkshops = action.payload.nearby_workshops;
      })
      .addCase(createServiceRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchNearbyWorkshops.fulfilled, (state, action) => {
          state.loading = false;
          state.currentRequest = action.payload.request;
          state.nearbyWorkshops = action.payload.nearby_workshops;
      })

      .addCase(fetchUserRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
  }
});

export const { clearRequestError } = serviceRequestSlice.actions;
export default serviceRequestSlice.reducer;