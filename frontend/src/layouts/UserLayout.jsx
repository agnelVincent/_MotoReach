import UserNavbar from "../components/navbars/UserNavbar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";

function UserLayout() {
    return (
        <div className="flex flex-col min-h-screen">
            <UserNavbar />
            <div className="flex-grow pt-16">
                <Outlet />
            </div>
            <Footer />
        </div>
    );
}

export default UserLayout;
