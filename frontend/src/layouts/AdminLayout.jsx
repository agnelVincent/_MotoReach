import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/navbars/AdminNavbar";
import { Toaster } from "react-hot-toast";

function AdminLayout() {
    return (
        <div className="flex flex-col min-h-screen">
            <Toaster position="top-center" reverseOrder={false} />
            <AdminNavbar />
            <main className="flex-grow pt-16">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

export default AdminLayout;