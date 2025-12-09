import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStatus } from "../hooks/useAuthStatus";
import { getRolePath } from "./AuthRedirect";

const AuthGuard = ({ allowedRoles = [] }) => {
    const { isAuthenticated, role } = useAuthStatus();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const isAuthorized =
        allowedRoles.length === 0 || (role && allowedRoles.includes(role));

    if (!isAuthorized) {
        const fallback = getRolePath(role);
        return <Navigate to={fallback} replace />;
    }

    return <Outlet />;
};

export default AuthGuard;