import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../utils/authApi";

export const store = configureStore({
    reducer : {
        [authApi.reducerPath] : authApi.reducer,
        auth : authReducer
    },
    middleware : (getDefaultMiddleware) => 
        getDefaultMiddleware().concat(authApi.middleware),
    devTools : process.env.NODE_ENV !== 'production'
})