import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/navbars/AdminNavbar";


function AdminLayout() {
    return (
        <>
            <AdminNavbar />
            <Outlet />
            <Footer />
        </>
    );
}

export default AdminLayout;



