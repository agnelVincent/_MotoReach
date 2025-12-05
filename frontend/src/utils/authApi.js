import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react'

const BASE_API_URL = 'http://localhost:8000/api/accounts'

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery : fetchBaseQuery({
        baseUrl : BASE_API_URL  
    }),
    tagTypes : ['Auth'],
    endpoints : (builder) => ({
        register : builder.mutation({
            query: (data) => ({
                url: 'register/',
                method: 'POST',
                body: data
            })
        }),

        verifyOtp : builder.mutation({
            query : (data) => ({
                url : 'verify-otp/',
                method : 'POST',
                body : data
            })
        }),

        resendOtp : builder.mutation({
            query : (data) => ({
                url : 'resend-otp/',
                method : 'POST',
                body : data
            })
        })
    })
})

export const {
    useRegisterMutation, useVerifyOtpMutation, useResendOtpMutation
} = authApi