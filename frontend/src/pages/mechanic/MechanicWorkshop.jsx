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

    // Loading state
    if (fetchLoading && !currentWorkshop) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&display=swap');
                    .font-body { font-family: 'Geist', 'Inter', sans-serif; }
                `}</style>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
                    <p className="font-body text-gray-500 font-medium">Loading workshop info…</p>
                </div>
            </div>
        );
    }

    // ACCEPTED → workshop details
    if (currentWorkshop && currentWorkshop.joining_status === 'ACCEPTED') {
        return <MechanicWorkshopDetails workshop={currentWorkshop} />;
    }

    // PENDING → pending request view
    if (currentWorkshop && currentWorkshop.joining_status === 'PENDING') {
        return <MechanicPendingRequest workshop={currentWorkshop} />;
    }

    // null / REJECTED → find workshop
    return <MechanicFindWorkshop />;
};

export default MechanicWorkshop;