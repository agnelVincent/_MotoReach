import Footer from "../components/Footer";
import { Outlet, useLocation } from "react-router-dom";
import UserNavbar from "../components/navbars/UserNavbar";

function PublicLayout() {
    const location = useLocation();
    const authPaths = ['/login', '/register', '/verify-otp', '/forgot-password'];
    const isAuthPage = authPaths.includes(location.pathname);

    return (
        <div className="flex flex-col min-h-screen">
            <UserNavbar />
            <div className={`flex-grow ${isAuthPage ? '' : 'pt-16'}`}>
                <Outlet />
            </div>
            <Footer />
        </div>
    );
}

export default PublicLayout;
