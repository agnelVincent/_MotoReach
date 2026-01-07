import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";

export const initiatePlatformFeePayment = createAsyncThunk(
    "payment/initiatePlatformFee",
    async ({ serviceRequestId }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("payments/create-checkout-session/", {
                service_request_id: serviceRequestId,
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Failed to initiate payment"
            );
        }
    }
);

export const payPlatformFeeWithWallet = createAsyncThunk(
    "payment/payPlatformFeeWithWallet",
    async ({ serviceRequestId }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("payments/wallet/pay-fee/", {
                service_request_id: serviceRequestId,
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Failed to pay with wallet"
            );
        }
    }
);

const paymentSlice = createSlice({
    name: "payment",
    initialState: {
        loading: false,
        error: null,
        checkoutUrl: null,
        paymentStatus: 'idle',
    },
    reducers: {
        resetPaymentState: (state) => {
            state.loading = false;
            state.error = null;
            state.checkoutUrl = null;
            state.paymentStatus = 'idle';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(initiatePlatformFeePayment.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.paymentStatus = 'loading';
            })
            .addCase(initiatePlatformFeePayment.fulfilled, (state, action) => {
                state.loading = false;
                state.checkoutUrl = action.payload.url;
                state.paymentStatus = 'succeeded';
            })
            .addCase(initiatePlatformFeePayment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.paymentStatus = 'failed';
            })

            .addCase(payPlatformFeeWithWallet.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.paymentStatus = 'loading';
            })
            .addCase(payPlatformFeeWithWallet.fulfilled, (state) => {
                state.loading = false;
                state.paymentStatus = 'succeeded';
            })
            .addCase(payPlatformFeeWithWallet.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.paymentStatus = 'failed';
            });
    },
});

export const { resetPaymentState } = paymentSlice.actions;
export default paymentSlice.reducer;
