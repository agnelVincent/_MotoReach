import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

const ACCESS_TOKEN_KEY = 'accessToken';
const USER_KEY = 'user';
const OTP_SESSION_KEY = 'otpSession';
const OTP_EXPIRY_MS = 60 * 1000; 

export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (userData,{rejectWithValue}) => {
        try{
            const response = await axiosInstance.post('accounts/login/',userData)
            console.log(response.data)
            return response.data
        }
        catch (error){
            if(error.response && error.response.data){
                console.log(error.response, error.response.data)
                return rejectWithValue(error.response.data)
            }
            return rejectWithValue({'error' : error.message})
        }
    }
)

export const logoutUser = createAsyncThunk(
    'auth/logoutUser',
    async(_,{dispatch,rejectWithValue}) => {
        try{
            const response = await axiosInstance.post('accounts/logout/')
            dispatch(authSlice.actions.logout())
            return {success : true}
        }
        catch (error){
            console.log(error)
            dispatch(authSlice.actions.logout())
            if (error.message && error.response.data){
                return rejectWithValue(error.response.data)
            }
            return rejectWithValue({ 'error': error.message})
        }
    }
)

export const googleLogin = createAsyncThunk(
    'auth/googleLogin',
    async (idToken, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("accounts/google/", {
                id_token: idToken
            });
            return response.data;
        } catch (error) {
            if (error.response) return rejectWithValue(error.response.data);
            return rejectWithValue({ error: error.message });
        }
    }
);


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

    let authState = {isAuthenticated : false, accessToken : null, user : null}
    try{
        const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
        const user = localStorage.getItem(USER_KEY)
        if(accessToken && user){
            return{
                isAuthenticated : true,
                accessToken : accessToken,
                user : JSON.parse(user)
            }
        }
    }
    catch (error){
        console.log(error)
        localStorage.removeItem(ACCESS_TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
    }

    let otpState = {
        isRegistered : false,
        pendingEmail : null,
        pendingRole : null,
        isVerifying : false,
        isResending : false,
        otpVerified : false,
        otpResendAttempts : 0,
        otpResendSuccess : null,
        otpCreatedAt : null
    }
    
    try {
        const stored = sessionStorage.getItem(OTP_SESSION_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            const now = Date.now();
            const otpCreatedAt = parsed.otpCreatedAt;
            
            if (otpCreatedAt && (now - otpCreatedAt) < OTP_EXPIRY_MS) {
                return {
                    ...otpState,
                    isRegistered : true,
                    pendingEmail : parsed.pendingEmail,
                    pendingRole : parsed.pendingRole,
                    otpResendAttempts : parsed.otpResendAttempts || 0,
                    otpCreatedAt : parsed.otpCreatedAt
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
        ...authState,
        ...otpState,
        loading : false,
        error : null
    };
};

const initialState = loadInitialState();


const authSlice = createSlice({
    name : 'auth',
    initialState,
    reducers : {
        setAccessToken : (state,action) => {
            state.accessToken = action.payload,
            localStorage.setItem(ACCESS_TOKEN_KEY, action.payload)
        },
        logout : (state) => {
            state.isAuthenticated = false,
            state.accessToken = null,
            state.user = null,
            state.loading = false,
            state.error = null,
            localStorage.removeItem(ACCESS_TOKEN_KEY),
            localStorage.removeItem(USER_KEY)
            sessionStorage.removeItem(OTP_SESSION_KEY)
        },
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
            sessionStorage.removeItem(OTP_SESSION_KEY)
        },
        clearError : (state) => {
            state.error = null
        }
    },
    extraReducers: (builder) => {
        builder 
        .addCase(loginUser.pending, (state) => {
            state.loading = true
            state.error = null
        })
        .addCase(loginUser.fulfilled, (state,action) => {
            state.loading = false
            state.error = null
            state.isAuthenticated = true
            state.accessToken = action.payload.access
            localStorage.setItem(ACCESS_TOKEN_KEY,action.payload.access)
            const userData = {
                id : action.payload.user_id,
                full_name : action.payload.full_name,
                email: action.payload.email,
                role : action.payload.role
            }
            state.user = userData
            localStorage.setItem(USER_KEY, JSON.stringify(userData))
            state.isRegistered = false
            state.otpVerified = false
            sessionStorage.removeItem(OTP_SESSION_KEY)
        })
        .addCase(loginUser.rejected, (state, action) => {
            state.loading = false
            state.isAuthenticated = false
            state.accessToken = null
            state.user = null
            const errorPayload = action.payload || {};
            state.error = errorPayload.detail 
                    || errorPayload.error 
                    || 'Login failed. Please check your credentials and try again.';
            localStorage.removeItem(ACCESS_TOKEN_KEY)
            localStorage.removeItem(USER_KEY)
        })

        .addCase(googleLogin.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(googleLogin.fulfilled, (state, action) => {
            state.loading = false;
            state.isAuthenticated = true;
            state.accessToken = action.payload.access;
            localStorage.setItem('accessToken', action.payload.access);
            localStorage.setItem('user', JSON.stringify(action.payload.user));
            state.user = action.payload.user;
        })
        .addCase(googleLogin.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload.error || 'Google login failed';
        })


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