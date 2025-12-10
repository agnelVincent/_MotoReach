import { Route } from "react-router-dom";
import Register from "../pages/auth/Register";
import VerifyOTP from "../pages/auth/VerifyOTP";
import Login from "../pages/auth/Login";
import LandingPage from "../pages/landing_page/LandingPage";
import AuthRedirect from "./AuthRedirect";
import PublicLayout from "../layouts/PublicLayout";
import PasswordResetFlow from "../pages/auth/PasswordResetFlow";

function PublicRoutes() {
    return (
        <>
            <Route element={<AuthRedirect />}>
                <Route element={<PublicLayout />}>
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-otp" element={<VerifyOTP />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<PasswordResetFlow />} />
                </Route>
            </Route>
            <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
            </Route>
        </>
    );
}

export default PublicRoutes;
