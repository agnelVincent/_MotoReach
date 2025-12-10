import { configureStore } from "@reduxjs/toolkit";
import authReducer from './slices/authSlice'
import forgotPasswordReducer from './slices/forgotPasswordSlice'

export const store = configureStore({
    reducer: {
        auth : authReducer,
        forgotPassword: forgotPasswordReducer,
    }
})