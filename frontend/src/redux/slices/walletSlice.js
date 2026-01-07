import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";

export const fetchWallet = createAsyncThunk(
    'wallet/fetchWallet',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('payments/wallet/');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to fetch wallet");
        }
    }
);

export const fetchWalletTransactions = createAsyncThunk(
    'wallet/fetchTransactions',
    async ({ page = 1, pageSize = 20 }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`payments/wallet/transactions/?page=${page}&page_size=${pageSize}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to fetch transactions");
        }
    }
);

export const initiateAddMoney = createAsyncThunk(
    'wallet/initiateAddMoney',
    async (amount, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('payments/wallet/add-money/', { amount });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to initiate payment");
        }
    }
);

const walletSlice = createSlice({
    name: 'wallet',
    initialState: {
        balance: 0,
        recentTransactions: [],
        allTransactions: [],
        totalTransactions: 0,
        currentPage: 1,
        hasMore: false,
        loading: false,
        transactionsLoading: false,
        error: null,
    },
    reducers: {
        clearWalletError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWallet.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWallet.fulfilled, (state, action) => {
                state.loading = false;
                state.balance = action.payload.balance;
                state.recentTransactions = action.payload.recent_transactions || [];
            })
            .addCase(fetchWallet.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(fetchWalletTransactions.pending, (state) => {
                state.transactionsLoading = true;
            })
            .addCase(fetchWalletTransactions.fulfilled, (state, action) => {
                state.transactionsLoading = false;
                state.allTransactions = action.payload.transactions;
                state.totalTransactions = action.payload.total;
                state.currentPage = action.payload.page;
                state.hasMore = action.payload.has_more;
            })
            .addCase(fetchWalletTransactions.rejected, (state, action) => {
                state.transactionsLoading = false;
                state.error = action.payload;
            })

            .addCase(initiateAddMoney.pending, (state) => {
                state.loading = true;
            })
            .addCase(initiateAddMoney.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(initiateAddMoney.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearWalletError } = walletSlice.actions;
export default walletSlice.reducer;
