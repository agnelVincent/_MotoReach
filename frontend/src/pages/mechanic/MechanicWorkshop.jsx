import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentWorkshop, clearMessages } from '../../redux/slices/workshopMechanicSlice';
import MechanicFindWorkshop from './MechanicFindWorkshop';
import MechanicWorkshopDetails from './MechanicWorkshopDetails';
import MechanicPendingRequest from './MechanicPendingRequest';
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
            dispatch(fetchCurrentWorkshop());
        }
        if (error) {
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

    // If workshop exists and status is ACCEPTED -> show details
    if (currentWorkshop && currentWorkshop.joining_status === 'ACCEPTED') {
        return <MechanicWorkshopDetails workshop={currentWorkshop} />;
    }

    // If workshop exists and status is PENDING -> show pending request UI
    if (currentWorkshop && currentWorkshop.joining_status === 'PENDING') {
        return <MechanicPendingRequest workshop={currentWorkshop} />;
    }

    // Otherwise (null, REJECTED) -> show find workshop
    return <MechanicFindWorkshop />;
};

export default MechanicWorkshop;
