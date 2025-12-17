import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/navbars/AdminNavbar";
import { Toaster } from "react-hot-toast";

function AdminLayout() {
    return (
        <>
            <Toaster position="top-center" reverseOrder={false} />
            
            <AdminNavbar />
            <main className="min-h-screen">
                <Outlet />
            </main>
            <Footer />
        </>
    );
}

export default AdminLayout;