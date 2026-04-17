import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export const fetchMechanicWallet = createAsyncThunk(
    'mechanicWallet/fetchMechanicWallet',
    async ({ page = 1, pageSize = 20} = {}, {rejectWithValue}) => {
        try{
            const response = await axiosInstance.get(
                `payments/mechanic/wallet/?page=${page}&page_size=${pageSize}`
            )
            return response.data
        }
        catch(error){
            return rejectWithValue(
                error.response?.data?.error || 'Failed to fetch mechanic wallet'
            )
        }
    }
)