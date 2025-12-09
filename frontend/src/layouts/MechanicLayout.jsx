import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";

// Placeholder navbar until a dedicated mechanic navbar exists
function MechanicNavbar() {
    return (
        <header className="w-full bg-slate-800 text-white px-6 py-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
                <span className="font-semibold">Mechanic</span>
                <span className="text-sm opacity-80">MotoReach</span>
            </div>
        </header>
    );
}

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


