import WorkshopNavbar from "../components/navbars/WorkshopNavbar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import WorkshopGuard from "../pages/workshop/workshop_guard/WorkshopGuard";

function WorkshopLayout() {
    return (
        <>
            <WorkshopNavbar />
            <WorkshopGuard>
            <Outlet />
            </WorkshopGuard>
            <Footer />
        </>
    );
}

export default WorkshopLayout;



