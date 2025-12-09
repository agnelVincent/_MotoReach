import WorkshopNavbar from "../components/navbars/WorkshopNavbar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";

function WorkshopLayout() {
    return (
        <>
            <WorkshopNavbar />
            <Outlet />
            <Footer />
        </>
    );
}

export default WorkshopLayout;

