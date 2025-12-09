import { Navigate, Outlet } from "react-router-dom";
import { useAuthStatus } from "../hooks/useAuthStatus";

export const getRolePath = (role) => {
    switch (role) {
        case "admin":
            return "/admin";
        case "mechanic":
            return "/mechanic";
        case "workshop_admin":
            return "/workshop";
        case "user":
        default:
            return "/user";
    }
};

const AuthRedirect = () => {
    const { isAuthenticated, role } = useAuthStatus();

    if (isAuthenticated) {
        const defaultPath = getRolePath(role);
        return <Navigate to={defaultPath} replace />;
    }

    return <Outlet />;
};

export default AuthRedirect;