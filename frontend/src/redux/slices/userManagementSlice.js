import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';
import { verifyWorkshop } from './adminSlice';

export const fetchUsers = createAsyncThunk(
    'userManagement/fetchUsers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('admin-panel/users/');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch users');
        }
    }
);

export const fetchWorkshops = createAsyncThunk(
    'userManagement/fetchWorkshops',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('admin-panel/workshops/');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch workshops');
        }
    }
);

export const fetchMechanics = createAsyncThunk(
    'userManagement/fetchMechanics',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('admin-panel/mechanics/');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch mechanics');
        }
    }
);

export const toggleBlockStatus = createAsyncThunk(
    'userManagement/toggleBlockStatus',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.patch(`admin-panel/users/${userId}/toggle-block/`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to update status');
        }
    }
);

const userManagementSlice = createSlice({
    name: 'userManagement',
    initialState: {
        users: [],
        workshops: [],
        mechanics: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder

            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })


            .addCase(fetchWorkshops.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchWorkshops.fulfilled, (state, action) => {
                state.loading = false;
                state.workshops = action.payload;
            })
            .addCase(fetchWorkshops.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })


            .addCase(fetchMechanics.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchMechanics.fulfilled, (state, action) => {
                state.loading = false;
                state.mechanics = action.payload;
            })
            .addCase(fetchMechanics.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(toggleBlockStatus.fulfilled, (state, action) => {
                const { userId, isBlocked, status } = action.payload;


                const user = state.users.find(u => u.id === userId);
                if (user) {
                    user.status = status;
                    user.isActive = !isBlocked;
                }

                const workshop = state.workshops.find(w => w.userId === userId);
                if (workshop) {
                    workshop.isBlocked = isBlocked;
                }

                const mechanic = state.mechanics.find(m => m.userId === userId);
                if (mechanic) {
                    mechanic.isBlocked = isBlocked;
                }
            })

            .addCase(verifyWorkshop.fulfilled, (state, action) => {
                const { workshopId, action: verificationAction } = action.payload;
                const workshop = state.workshops.find(w => w.id === workshopId);
                if (workshop) {
                    workshop.verificationStatus = verificationAction.charAt(0).toUpperCase() + verificationAction.slice(1) + (verificationAction.endsWith('e') ? 'd' : 'ed');
                }
            });
    },
});

export default userManagementSlice.reducer;
