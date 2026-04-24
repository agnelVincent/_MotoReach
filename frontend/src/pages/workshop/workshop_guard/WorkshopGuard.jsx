import { useSelector, useDispatch } from "react-redux"
import WorkshopPendingPage from "../WorkshopPendingPage"
import WorkshopRejectedPage from "../WorkshopRejectedPage"
import { useEffect } from "react";
import { getProfile } from "../../../redux/slices/ProfileSlice";

const WorkshopGuard = ({ children }) => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    useEffect(() => {
        if (user?.role === 'workshop_admin') {
            dispatch(getProfile());
        }
    }, [dispatch, user?.role]);
    
    if (user && user.role == 'workshop_admin' && user.workshop_status) {
        const status = user.workshop_status
        if (status === 'PENDING' || status === 'REQUESTED_AGAIN') {
            return <WorkshopPendingPage />
        }

        if (status === 'REJECTED') {
            return <WorkshopRejectedPage />
        }

        if (status === 'APPROVED') {
            return <>{children}</>
        }

    }
    return <>404</>
}

export default WorkshopGuard