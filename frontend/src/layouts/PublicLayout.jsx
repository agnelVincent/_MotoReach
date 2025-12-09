import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import UserNavbar from "../components/navbars/UserNavbar";

function PublicLayout() {
    return (
        <>
            <UserNavbar />
            <Outlet />
            <Footer />
        </>
    );
}

export default PublicLayout;

