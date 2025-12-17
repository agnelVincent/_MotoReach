import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export const fetchAdminStats = createAsyncThunk(
    'admin/fetchStats',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('admin-panel/stats/');
            console.log(response.data)
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to load admin data");
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
            })
            .addCase(fetchAdminStats.fulfilled, (state, action) => {
                state.loading = false;
                state.stats = action.payload;
            })
            .addCase(fetchAdminStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export default adminSlice.reducer;