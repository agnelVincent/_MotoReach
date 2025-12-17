import { Route } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import AdminDashboard from "../../pages/admin/AdminDashboard";
import AdminUser from "../../pages/admin/AdminUser";
import AdminWorkshop from "../../pages/admin/AdminWorkshop";
import AdminMechanic from "../../pages/admin/AdminMechanic";

function AdminRoute() {
    return (
        <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUser/>}/>
            <Route path="workshops" element={<AdminWorkshop/>}/>
            <Route path="mechanics" element={<AdminMechanic/>}/>
        </Route>
    );
}

export default AdminRoute;



