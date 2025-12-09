import { Route } from "react-router-dom";
import Register from "../pages/auth/Register";
import VerifyOTP from "../pages/auth/VerifyOTP";
import Login from "../pages/auth/Login";
import LandingPage from "../pages/landing_page/LandingPage";
import AuthRedirect from "./AuthRedirect";

function PublicRoutes() {
    return (
        <>
            <Route element={<AuthRedirect />}>
                <Route path="/register" element={<Register />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />
                <Route path="/login" element={<Login />} />
            </Route>
            <Route path="/" element={<LandingPage />} />
        </>
    );
}

export default PublicRoutes;
