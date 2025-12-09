import { Route } from "react-router-dom";
import AuthGuard from "./AuthGuard";
import UserHome from "../pages/user/UserHome";
import WorkshopDashboard from "../pages/workshop/WorkshopDashboard";
import MechanicDashboard from "../pages/mechanic/MechanicDashboard";
import AdminDashboard from "../pages/admin/AdminDashboard";

export default function PrivateRoutes() {
    return (
        <>
            <Route element={<AuthGuard allowedRoles={["user"]} />}>
                <Route path="/user" element={<UserHome />} />
                <Route path="/user/home" element={<UserHome />} />
            </Route>

            <Route element={<AuthGuard allowedRoles={["workshop"]} />}>
                <Route path="/workshop" element={<WorkshopDashboard />} />
            </Route>

            <Route element={<AuthGuard allowedRoles={["mechanic"]} />}>
                <Route path="/mechanic" element={<MechanicDashboard />} />
            </Route>

            <Route element={<AuthGuard allowedRoles={["admin"]} />}>
                <Route path="/admin" element={<AdminDashboard />} />
            </Route>
        </>
    );
}