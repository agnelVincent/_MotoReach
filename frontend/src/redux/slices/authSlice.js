import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async (userData, {rejectWithValue}) => {
        try{
            const response = await axiosInstance.post('accounts/register/',userData)
            return response.data
        }
        catch (error){
            if(error.response && error.response.data){
                console.log(error.response,error.response.data)
                return rejectWithValue(error.response.data)
            }
            return rejectWithValue({error : error.message})
        }
    }
)

export const verifyOtp = createAsyncThunk(
    'auth/verifyOtp',
    async ({email, otp, role}, {rejectWithValue}) => {
        try{
            const response = await axiosInstance.post('accounts/verify-otp/',{email,otp,role})
            return response.data
        }
        catch (error){
            if(error.response && error.response.data){
                return rejectWithValue(error.response.data)
            }
            return rejectWithValue({error : error.message})
        }
}
)

export const resendOtp = createAsyncThunk(
    'auth/resendOtp',
    async ({email,role},{getState, rejectWithValue}) => {
        const {auth} = getState()
        const currentAttempts = auth.otpResendAttempts
        const MAX_ATTEMPTS = 3

        if(currentAttempts >= MAX_ATTEMPTS){
            return rejectWithValue({error : `Maximum resend limit ${MAX_ATTEMPTS} reached. Please wait or contact support`})
        }
        try{
            const response = await axiosInstance.post('accounts/resend-otp/',{email,role})
            return response.data
        }
        catch (error){
            if(error.response && error.response.data){
                return rejectWithValue(error.response.data)
            }
            return rejectWithValue({error : error.message})
        }
    }
)

const loadInitialState = () => {
    try {
        const stored = sessionStorage.getItem('otpSession');
        if (stored) {
            const parsed = JSON.parse(stored);
            const now = Date.now();
            const otpCreatedAt = parsed.otpCreatedAt;
            const OTP_EXPIRY_MS = 60 * 1000;
            
            if (otpCreatedAt && (now - otpCreatedAt) < OTP_EXPIRY_MS) {
                return {
                    isRegistered: true,
                    pendingEmail: parsed.pendingEmail,
                    pendingRole: parsed.pendingRole,
                    loading: false,
                    isVerifying: false,
                    isResending: false,
                    error: null,
                    otpVerified: false,
                    otpResendAttempts: parsed.otpResendAttempts || 0,
                    otpResendSuccess: null,
                    otpCreatedAt: parsed.otpCreatedAt
                };
            } else {
                sessionStorage.removeItem('otpSession');
            }
        }
    } catch (error) {
        console.error('Error loading OTP session from sessionStorage:', error);
        sessionStorage.removeItem('otpSession');
    }
    
    return {
        isRegistered: false,
        pendingEmail: null,
        pendingRole: null,
        loading: false,
        isVerifying: false,
        isResending: false,
        error: null,
        otpVerified: false,
        otpResendAttempts: 0,
        otpResendSuccess: null,
        otpCreatedAt: null
    };
};

const initialState = loadInitialState();


const authSlice = createSlice({
    name : 'auth',
    initialState,
    reducers : {
        resetAuth : (state) => {
            state.isRegistered = false
            state.pendingEmail = null
            state.pendingRole = null
            state.loading = false
            state.isVerifying = false
            state.isResending = false
            state.error = null
            state.otpVerified = false
            state.otpResendAttempts = 0
            state.otpResendSuccess = null
            state.otpCreatedAt = null
            sessionStorage.removeItem('otpSession')
        },
        clearError : (state) => {
            state.error = null
        }
    },
    extraReducers: (builder) => {
        builder 
        .addCase(registerUser.pending, (state) => {
            state.loading = true
            state.error = false
            state.isRegistered = false
        })
        .addCase(registerUser.fulfilled, (state,action) => {
            state.loading = false
            state.isRegistered = true
            state.pendingEmail = action.payload.email
            state.pendingRole = action.payload.role
            state.error = null
            state.otpResendAttempts = 0
            state.otpCreatedAt = Date.now()
            
            try {
                sessionStorage.setItem('otpSession', JSON.stringify({
                    pendingEmail: action.payload.email,
                    pendingRole: action.payload.role,
                    otpResendAttempts: 0,
                    otpCreatedAt: state.otpCreatedAt
                }))
            } catch (error) {
                console.error('Error saving OTP session to sessionStorage:', error)
            }
        })
        .addCase(registerUser.rejected, (state,action) => {
            state.error = action.payload
            state.loading = false
            state.isRegistered = false
        })


        .addCase(verifyOtp.pending, (state) => {
            state.isVerifying = true;
            state.loading = true;
            state.error = null;
        })
        .addCase(verifyOtp.fulfilled, (state, action) => {
            state.isVerifying = false;
            state.loading = false;
            state.otpVerified = true;
            state.error = null;
            sessionStorage.removeItem('otpSession');
        })
        .addCase(verifyOtp.rejected, (state, action) => {
            state.isVerifying = false;
            state.loading = false;
            state.error = action.payload; 
            state.otpVerified = false;
        })
        

        .addCase(resendOtp.pending, (state) => {
            state.isResending = true;
            state.loading = true;
            state.otpResendSuccess = null;
            state.error = null;
        })
        .addCase(resendOtp.fulfilled, (state, action) => {
            state.isResending = false;
            state.loading = false;
            state.otpResendAttempts += 1;
            state.otpResendSuccess = action.payload.message || 'OTP resent successfully.';
            state.error = null;
            state.otpCreatedAt = Date.now(); 
            
            try {
                const stored = sessionStorage.getItem('otpSession');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    parsed.otpCreatedAt = state.otpCreatedAt;
                    parsed.otpResendAttempts = state.otpResendAttempts;
                    sessionStorage.setItem('otpSession', JSON.stringify(parsed));
                }
            } catch (error) {
                console.error('Error updating OTP session in sessionStorage:', error);
            }
        })
        .addCase(resendOtp.rejected, (state, action) => {
            state.isResending = false;
            state.loading = false;
            state.error = action.payload; 
            state.otpResendSuccess = null;
        });

    }
})

export const {resetAuth,clearError} = authSlice.actions
export default authSlice.reducer