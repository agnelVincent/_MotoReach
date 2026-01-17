import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export const searchWorkshops = createAsyncThunk(
    'workshopMechanic/searchWorkshops',
    async (query, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`accounts/workshops/search/?query=${query}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to search workshops');
        }
    }
);

export const sendJoinRequest = createAsyncThunk(
    'workshopMechanic/sendJoinRequest',
    async (workshopId, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('accounts/mechanic/join/', { workshop_id: workshopId });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to send request');
        }
    }
);

export const fetchMechanicRequests = createAsyncThunk(
    'workshopMechanic/fetchMechanicRequests',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('accounts/workshop/mechanic-requests/');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch requests');
        }
    }
);

export const respondToRequest = createAsyncThunk(
    'workshopMechanic/respondToRequest',
    async ({ mechanicId, action }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('accounts/workshop/mechanic-requests/action/', {
                mechanic_id: mechanicId,
                action
            });
            return { mechanicId, action, message: response.data.message };
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Action failed');
        }
    }
);

export const fetchMyMechanics = createAsyncThunk(
    'workshopMechanic/fetchMyMechanics',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('accounts/workshop/mechanics/');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch mechanics');
        }
    }
);

export const fetchCurrentWorkshop = createAsyncThunk(
    'workshopMechanic/fetchCurrentWorkshop',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('accounts/mechanic/current-workshop/');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch current workshop');
        }
    }
);

export const leaveWorkshop = createAsyncThunk(
    'workshopMechanic/leaveWorkshop',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('accounts/mechanic/leave/');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to leave workshop');
        }
    }
);

export const removeMechanic = createAsyncThunk(
    'workshopMechanic/removeMechanic',
    async (mechanicId, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('accounts/workshop/mechanic/remove/', { mechanic_id: mechanicId });
            return { mechanicId, message: response.data.message };
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to remove mechanic');
        }
    }
);

const workshopMechanicSlice = createSlice({
    name: 'workshopMechanic',
    initialState: {
        searchResults: [],
        mechanicRequests: [],
        myMechanics: [],
        currentWorkshop: null, 
        loading: false,
        searchLoading: false,
        requestsLoading: false, 
        actionLoading: false, 
        fetchLoading: false, 
        error: null,
        successMessage: null,
    },
    reducers: {
        clearMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        },
        clearSearchResults: (state) => {
            state.searchResults = [];
        }
    },
    extraReducers: (builder) => {
        builder
            // Search Workshops
            .addCase(searchWorkshops.pending, (state) => {
                state.searchLoading = true;
            })
            .addCase(searchWorkshops.fulfilled, (state, action) => {
                state.searchLoading = false;
                state.searchResults = action.payload;
            })
            .addCase(searchWorkshops.rejected, (state, action) => {
                state.searchLoading = false;
                state.error = action.payload;
            })

            // Send Join Request
            .addCase(sendJoinRequest.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(sendJoinRequest.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.successMessage = action.payload.message;
            })
            .addCase(sendJoinRequest.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            })

            // Fetch Requests (Workshop Side)
            .addCase(fetchMechanicRequests.pending, (state) => {
                state.requestsLoading = true;
            })
            .addCase(fetchMechanicRequests.fulfilled, (state, action) => {
                state.requestsLoading = false;
                state.mechanicRequests = action.payload;
            })
            .addCase(fetchMechanicRequests.rejected, (state, action) => {
                state.requestsLoading = false;
                state.error = action.payload;
            })

            // Respond to Request
            .addCase(respondToRequest.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(respondToRequest.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.successMessage = action.payload.message;
                // Remove from detailed list
                state.mechanicRequests = state.mechanicRequests.filter(m => m.mechanic_id !== action.payload.mechanicId);
            })
            .addCase(respondToRequest.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            })

            // Fetch My Mechanics
            .addCase(fetchMyMechanics.pending, (state) => {
                state.fetchLoading = true;
            })
            .addCase(fetchMyMechanics.fulfilled, (state, action) => {
                state.fetchLoading = false;
                state.myMechanics = action.payload;
            })
            .addCase(fetchMyMechanics.rejected, (state, action) => {
                state.fetchLoading = false;
                state.error = action.payload;
            })

            // Current Workshop
            .addCase(fetchCurrentWorkshop.pending, (state) => {
                state.fetchLoading = true;
            })
            .addCase(fetchCurrentWorkshop.fulfilled, (state, action) => {
                state.fetchLoading = false;
                state.currentWorkshop = action.payload;
            })
            .addCase(fetchCurrentWorkshop.rejected, (state, action) => {
                state.fetchLoading = false;
                state.error = action.payload;
            })

            // Leave Workshop
            .addCase(leaveWorkshop.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(leaveWorkshop.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.successMessage = action.payload.message;
                state.currentWorkshop = null;
            })
            .addCase(leaveWorkshop.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            })

            // Remove Mechanic
            .addCase(removeMechanic.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(removeMechanic.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.successMessage = action.payload.message;
                state.myMechanics = state.myMechanics.filter(m => m.mechanic_id !== action.payload.mechanicId);
            })
            .addCase(removeMechanic.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            });
    }
});

export const { clearMessages, clearSearchResults } = workshopMechanicSlice.actions;
export default workshopMechanicSlice.reducer;
