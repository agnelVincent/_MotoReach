import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import MechanicNavbar from "../components/navbars/MechanicNavbar";


function MechanicLayout() {
    return (
        <div className="flex flex-col min-h-screen">
            <MechanicNavbar />
            <div className="flex-grow pt-16">
                <Outlet />
            </div>
            <Footer />
        </div>
    );
}

export default MechanicLayout;
