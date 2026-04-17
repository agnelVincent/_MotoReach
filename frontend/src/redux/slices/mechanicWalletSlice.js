import { buildCreateSlice, createAsyncThunk, createListenerMiddleware, createSlice } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export const fetchMechanicWallet = createAsyncThunk(
    'mechanicWallet/fetchMechanicWallet',
    async ({ page = 1, pageSize = 20} = {}, {rejectWithValue}) => {
        try{
            const response = await axiosInstance.get(
                `payments/mechanic/wallet/?page=${page}&page_size=${pageSize}`
            )
            return response.data
        }
        catch(error){
            return rejectWithValue(
                error.response?.data?.error || 'Failed to fetch mechanic wallet'
            )
        }
    }
)

const mechanicWalletSlice = createSlice({
    name : 'mechanicWallet',
    initialState: {
        balance : '0.00',
        totalEarned : '0.00',
        thisMonth : '0.00',
        totalBonuses : '0.00',
        totalServices : 0,
        earnings : [],
        total : 0,
        currentPage : 1,
        hasMore : false,
        loading : false,
        error : null
    },
    reducers : {
        clearMechanicWalletError : (state) => {
            state.error = null
        }
    },
    extraReducers : (builder) => {
        builder 
            .addCase(fetchMechanicWallet.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchMechanicWallet.fulfilled, (state, action) => {
                const {
                    balance, total_earned, this_month, total_bonuses, total_services, earnings, total, page, has_more
                } = action.payload

                state.loading = false
                state.balance = balance
                state.totalEarned = total_earned
                state.thisMonth = this_month
                state.totalBonuses = total_bonuses
                state.totalServices = total_services;
                state.earnings      = earnings;
                state.total         = total;
                state.currentPage   = page;
                state.hasMore       = has_more;
            })
            .addCase(fetchMechanicWallet.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            });
    }
})


export const {clearMechanicWalletError} = mechanicWalletSlice.actions

export default mechanicWalletSlice.reducer