import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentWorkshop, clearMessages } from '../../redux/slices/workshopMechanicSlice';
import MechanicFindWorkshop from './MechanicFindWorkshop';
import MechanicWorkshopDetails from './MechanicWorkshopDetails';
import { toast } from 'react-hot-toast';

const MechanicWorkshop = () => {
    const dispatch = useDispatch();
    const { currentWorkshop, fetchLoading, error, successMessage } = useSelector(state => state.workshopMechanic);

    useEffect(() => {
        dispatch(fetchCurrentWorkshop());
    }, [dispatch]);

    useEffect(() => {
        if (successMessage) {
            toast.success(successMessage);
            dispatch(clearMessages());
            // If we just left, we should re-fetch to ensure state is clean (though reducer likely handled it)
            // But if we just joined, we definitely need to fetch
            dispatch(fetchCurrentWorkshop());
        }
        if (error) {
            // Only show error if it's not "not found" (which means just no workshop)
            // But our API currently returns null for no workshop, so error usually means real error
            // However, 500s or 400s might pop up.
            // If the error is simply because we aren't displaying anything, we might want to suppress it if it's "No workshop"
            // But let's assume API returns null 200 OK for no workshop.
            // If error exists, show it.
            toast.error(error);
            dispatch(clearMessages());
        }
    }, [successMessage, error, dispatch]);

    if (fetchLoading && !currentWorkshop) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    // Logic:
    // 1. If workshop exists and status is ACCEPTED -> details
    // 2. Otherwise (null, PENDING, REJECTED) -> find workshop
    //    Note: If PENDING, MechanicFindWorkshop should ideally show "Request Pending" state if we wanted to block search.
    //    But requirement says "if no workshop, show find workshop".
    //    If we pass PENDING to FindWorkshop, we can show a banner there if needed.
    //    Wait, `currentWorkshop` returns object with `joining_status`.

    if (currentWorkshop && currentWorkshop.joining_status === 'ACCEPTED') {
        return <MechanicWorkshopDetails workshop={currentWorkshop} />;
    }

    return <MechanicFindWorkshop currentWorkshop={currentWorkshop} />;
};

export default MechanicWorkshop;
