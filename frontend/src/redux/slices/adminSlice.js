import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export const fetchAdminStats = createAsyncThunk(
    'admin/fetchStats',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('admin-panel/stats/');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to load admin data");
        }
    }
);

export const verifyWorkshop = createAsyncThunk(
    'admin/verifyWorkshop',
    async ({ workshopId, action }, { rejectWithValue, dispatch }) => {
        try {
            const response = await axiosInstance.patch(`admin-panel/workshops/${workshopId}/verify/`, { action });
            dispatch(fetchAdminStats()); 
            return { workshopId, action };
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Verification failed');
        }
    }
);

const adminSlice = createSlice({
    name: 'admin',
    initialState: {
        stats: {
            metrics: { total_users: 0, total_workshops: 0, total_mechanics: 0 },
            recent_signups: [],
            pending_approvals: []
        },
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAdminStats.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAdminStats.fulfilled, (state, action) => {
                state.loading = false;
                state.stats = action.payload;
            })
            .addCase(fetchAdminStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(verifyWorkshop.pending, (state) => {
                state.loading = true;
            })
            .addCase(verifyWorkshop.fulfilled, (state, action) => {
                state.loading = false;
                state.stats.pending_approvals = state.stats.pending_approvals.filter(
                    (workshop) => workshop.id !== action.payload.workshopId
                );
            })
            .addCase(verifyWorkshop.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export default adminSlice.reducer;