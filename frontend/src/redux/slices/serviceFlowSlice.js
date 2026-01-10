import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";

export const fetchServiceExecution = createAsyncThunk(
    'serviceFlow/fetchExecution',
    async (requestId, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`service-request/${requestId}/execution/`);
            return response.data; 
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to fetch service execution details");
        }
    }
);

export const assignMechanics = createAsyncThunk(
    'serviceFlow/assignMechanics',
    async ({ requestId, mechanicIds }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`service-request/${requestId}/assign-mechanics/`, {
                mechanic_ids: mechanicIds
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to assign mechanics");
        }
    }
);

export const removeMechanic = createAsyncThunk(
    'serviceFlow/removeMechanic',
    async ({ requestId, mechanicId }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`service-request/${requestId}/remove-mechanic/`, {
                mechanic_id: mechanicId
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to remove mechanic");
        }
    }
);

export const fetchAssignableMechanics = createAsyncThunk(
    'serviceFlow/fetchAssignableMechanics',
    async (requestId, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`service-request/${requestId}/assignable-mechanics/`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to fetch assignable mechanics");
        }
    }
);

const serviceFlowSlice = createSlice({
    name: 'serviceFlow',
    initialState: {
        execution: null,
        loading: false,
        error: null,
        successMessage: null,
        assignableMechanics: []
    },
    reducers: {
        clearFlowError: (state) => { state.error = null; },
        clearFlowSuccess: (state) => { state.successMessage = null; }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchServiceExecution.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchServiceExecution.fulfilled, (state, action) => {
                state.loading = false;
                state.execution = action.payload;
            })
            .addCase(fetchServiceExecution.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchAssignableMechanics.pending, (state) => {
                state.error = null;
            })
            .addCase(fetchAssignableMechanics.fulfilled, (state, action) => {
                state.assignableMechanics = action.payload;
            })
            .addCase(fetchAssignableMechanics.rejected, (state, action) => {
                state.error = action.payload;
            })
            .addCase(assignMechanics.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(assignMechanics.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload?.message;
            })
            .addCase(assignMechanics.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(removeMechanic.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(removeMechanic.fulfilled, (state, action) => {
                state.loading = false;
                state.successMessage = action.payload?.message;
            })
            .addCase(removeMechanic.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearFlowError, clearFlowSuccess } = serviceFlowSlice.actions;
export default serviceFlowSlice.reducer;
