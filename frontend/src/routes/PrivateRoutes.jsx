import { Route } from "react-router-dom";
import AuthGuard from "./AuthGuard";
import UserRoute from "./RoleRoutes/UserRoute";
import WorkshopRoute from "./RoleRoutes/WorkshopRoute";
import MechanicRoute from "./RoleRoutes/MechanicRoute";
import AdminRoute from "./RoleRoutes/AdminRoute";

export default function PrivateRoutes() {
    return (
        <>
            <Route element={<AuthGuard allowedRoles={["user"]} />}>
                {UserRoute()}
            </Route>

            <Route element={<AuthGuard allowedRoles={["workshop"]} />}>
                {WorkshopRoute()}
            </Route>

            <Route element={<AuthGuard allowedRoles={["mechanic"]} />}>
                {MechanicRoute()}
            </Route>

            <Route element={<AuthGuard allowedRoles={["admin"]} />}>
                {AdminRoute()}
            </Route>
        </>
    );
}