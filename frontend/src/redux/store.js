import { configureStore } from "@reduxjs/toolkit";
import authReducer from './slices/authSlice'
import forgotPasswordReducer from './slices/forgotPasswordSlice'
import profileReducer from './slices/ProfileSlice'
import adminReducer from './slices/adminSlice'

export const store = configureStore({
    reducer: {
        auth : authReducer,
        forgotPassword: forgotPasswordReducer,
        profile: profileReducer,
        admin : adminReducer
    }
})