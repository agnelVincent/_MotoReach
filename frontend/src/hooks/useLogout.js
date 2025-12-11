import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../redux/slices/authSlice';

export const useLogout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const logout = async () => {
        try {
            await dispatch(logoutUser()).unwrap();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error("Logout failed:", error);
            navigate('/login', { replace: true });
        }
    };

    return { logout };
};
