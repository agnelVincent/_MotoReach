import { Route } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import AdminDashboard from "../../pages/admin/AdminDashboard";

function AdminRoute() {
    return (
        <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
        </Route>
    );
}

export default AdminRoute;



