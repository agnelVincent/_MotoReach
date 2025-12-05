import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    isAuthenticated : false,
    user : null,
    tempEmail : null,
    tempRole : null,
    registerSuccess : false
}

const authSlice = createSlice({
    name : auth,
    initialState,
    reducers : {
        setTempRegistrationData : (state,action) => {
            state.tempEmail = action.payload.email
            state.tempRole = action.payload.role
            state.registerSuccess = true
        },
        clearTempRegistrationData : (state) => {
            state.tempEmail = null
            state.tempRole = null
            state.registerSuccess = false
        },
        setUserAuthenticated : (state,action) => {
            state.isAuthenticated = true
            state.user = action.payload.user
            state.tempEmail = null
            state.tempRole = null
            state.registerSuccess = false
        },
        logoutUser : (state) => {
            state.isAuthenticated = false
            state.user = null
        }
    }
})

export const {
    setTempRegistrationData, clearTempRegistrationData, setUserAuthenticated, logoutUser
} = authSlice.actions

export default authSlice.reducer