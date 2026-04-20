import { Route } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import AdminDashboard from "../../pages/admin/AdminDashboard";
import AdminUser from "../../pages/admin/AdminUser";
import AdminWorkshop from "../../pages/admin/AdminWorkshop";
import AdminWorkshopDetail from "../../pages/admin/AdminWorkshopDetail";
import AdminMechanic from "../../pages/admin/AdminMechanic";
import AdminComplaints from "../../pages/admin/AdminComplaints";
import AdminWallet from "../../pages/admin/AdminWallet";

function AdminRoute() {
    return (
        <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUser />} />
            <Route path="workshops" element={<AdminWorkshop />} />
            <Route path="workshop-details/:id" element={<AdminWorkshopDetail />} />
            <Route path="mechanics" element={<AdminMechanic />} />
            <Route path="complaints" element={<AdminComplaints />} />
            <Route path="wallet" element={<AdminWallet />} />
        </Route>
    );
}

export default AdminRoute;



