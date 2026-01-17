import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";


export const createServiceRequest = createAsyncThunk(
  'serviceRequest/create',
  async (requestData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('service-request/create/', requestData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
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

export const fetchUserServiceRequests = createAsyncThunk(
  'serviceRequest/fetchUserRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('service-request/user-requests/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch requests");
    }
  }
);

export const fetchWorkshopRequests = createAsyncThunk(
  'serviceRequest/fetchWorkshopRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('service-request/workshop/connection-requests/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch requests");
    }
  }
);

export const acceptRequest = createAsyncThunk(
  'serviceRequest/acceptRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`service-request/workshop/connection-requests/${requestId}/accept/`);
      return { requestId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to accept request");
    }
  }
);

export const rejectRequest = createAsyncThunk(
  'serviceRequest/rejectRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`service-request/workshop/connection-requests/${requestId}/reject/`);
      return { requestId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to reject request");
    }
  }
);

export const cancelRequestWorkshop = createAsyncThunk(
  'serviceRequest/cancelRequestWorkshop',
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`service-request/workshop/connection-requests/${requestId}/cancel/`);
      return { requestId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to cancel request");
    }
  }
);

export const userCancelConnection = createAsyncThunk(
  'serviceRequest/userCancelConnection',
  async (serviceRequestId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`service-request/connection/${serviceRequestId}/cancel/`);
      return { serviceRequestId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to cancel connection");
    }
  }
);

export const userConnectToWorkshop = createAsyncThunk(
  'serviceRequest/userConnectToWorkshop',
  async ({ requestId, workshopId }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`service-request/${requestId}/connect/`, {
        workshop_id: workshopId
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to connect to workshop");
    }
  }
);

export const deleteServiceRequest = createAsyncThunk(
  'serviceRequest/deleteServiceRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`service-request/${requestId}/delete/`);
      return { requestId };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to delete request");
    }
  }
);

export const fetchWorkshopMechanics = createAsyncThunk(
  'serviceRequest/fetchMechanics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('service-request/workshop/my-mechanics/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch mechanics");
    }
  }
);

export const assignMechanic = createAsyncThunk(
  'serviceRequest/assignMechanic',
  async ({ serviceRequestId, mechanicId }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`service-request/execution/${serviceRequestId}/assign/`, { mechanic_id: mechanicId });
      // Refresh request details to show update
      dispatch(fetchNearbyWorkshops(serviceRequestId));
      dispatch(fetchWorkshopMechanics());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to assign mechanic");
    }
  }
);

export const removeMechanic = createAsyncThunk(
  'serviceRequest/removeMechanic',
  async ({ serviceRequestId, mechanicId }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`service-request/execution/${serviceRequestId}/remove/`, { mechanic_id: mechanicId });
      // Refresh details
      dispatch(fetchNearbyWorkshops(serviceRequestId));
      dispatch(fetchWorkshopMechanics());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to remove mechanic");
    }
  }
);


const serviceRequestSlice = createSlice({
  name: 'serviceRequest',
  initialState: {
    currentRequest: null,
    nearbyWorkshops: [],
    userRequests: [],
    workshopRequests: [],
    mechanics: [], 
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

      .addCase(fetchNearbyWorkshops.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNearbyWorkshops.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRequest = action.payload.request;
        state.nearbyWorkshops = action.payload.nearby_workshops;
        state.error = null;
      })
      .addCase(fetchNearbyWorkshops.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchUserServiceRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserServiceRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.userRequests = action.payload;
      })
      .addCase(fetchUserServiceRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchWorkshopRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWorkshopRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.workshopRequests = action.payload;
      })
      .addCase(fetchWorkshopRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchWorkshopMechanics.fulfilled, (state, action) => {
        state.mechanics = action.payload;
      })

      .addCase(acceptRequest.fulfilled, (state, action) => {
        const index = state.workshopRequests.findIndex(r => r.id === action.payload.requestId);
        if (index !== -1) {
          state.workshopRequests[index].status = 'ACCEPTED';
        }
      })
      .addCase(rejectRequest.fulfilled, (state, action) => {
        const index = state.workshopRequests.findIndex(r => r.id === action.payload.requestId);
        if (index !== -1) {
          state.workshopRequests[index].status = 'REJECTED';
        }
      })
      .addCase(cancelRequestWorkshop.fulfilled, (state, action) => {
        const index = state.workshopRequests.findIndex(r => r.id === action.payload.requestId);
        if (index !== -1) {
          state.workshopRequests[index].status = 'CANCELLED';
        }
      })
      .addCase(userCancelConnection.fulfilled, (state, action) => {
        state.loading = false;
        // Find the request in userRequests and update its status
        const index = state.userRequests.findIndex(r => r.id === action.payload.serviceRequestId);
        if (index !== -1) {
          state.userRequests[index].status = 'PLATFORM_FEE_PAID'; // Reset to fee paid
        }
      })
      .addCase(userConnectToWorkshop.pending, (state) => {
        state.loading = true;
      })
      .addCase(userConnectToWorkshop.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(userConnectToWorkshop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteServiceRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.userRequests = state.userRequests.filter(r => r.id !== action.payload.requestId);
      });
  }
});

export const { clearRequestError } = serviceRequestSlice.actions;
export default serviceRequestSlice.reducer;