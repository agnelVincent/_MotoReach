import WorkshopNavbar from "../components/navbars/WorkshopNavbar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import WorkshopGuard from "../pages/workshop/workshop_guard/WorkshopGuard";

function WorkshopLayout() {
    return (
        <div className="flex flex-col min-h-screen">
            <WorkshopNavbar />
            <div className="flex-grow pt-16">
                <WorkshopGuard>
                    <Outlet />
                </WorkshopGuard>
            </div>
            <Footer />
        </div>
    );
}

export default WorkshopLayout;
