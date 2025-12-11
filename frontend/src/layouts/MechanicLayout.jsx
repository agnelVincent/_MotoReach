import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import MechanicNavbar from "../components/navbars/MechanicNavbar";


function MechanicLayout() {
    return (
        <>
            <MechanicNavbar />
            <Outlet />
            <Footer />
        </>
    );
}

export default MechanicLayout;



