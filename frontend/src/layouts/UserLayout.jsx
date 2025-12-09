import UserNavbar from "../components/navbars/UserNavbar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";

function UserLayout() {
    return (
        <>
            <UserNavbar />
            <Outlet />
            <Footer />
        </>
    );
}

export default UserLayout;

