import { configureStore } from "@reduxjs/toolkit";
import authReducer from './slices/authSlice'
import forgotPasswordReducer from './slices/forgotPasswordSlice'
import profileReducer from './slices/ProfileSlice'
import adminReducer from './slices/adminSlice'
import userManagementReducer from './slices/userManagementSlice'
import serviceRequestReducer from './slices/serviceRequestSlice'
import paymentReducer from './slices/paymentSlice'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        forgotPassword: forgotPasswordReducer,
        profile: profileReducer,
        admin: adminReducer,
        userManagement: userManagementReducer,
        serviceRequest: serviceRequestReducer,
        payment: paymentReducer
    }
})