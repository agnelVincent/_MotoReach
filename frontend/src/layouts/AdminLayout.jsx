import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";

// Minimal admin navbar placeholder
function AdminNavbar() {
    return (
        <header className="w-full bg-gray-900 text-white px-6 py-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
                <span className="font-semibold">Admin</span>
                <span className="text-sm opacity-80">MotoReach</span>
            </div>
        </header>
    );
}

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


