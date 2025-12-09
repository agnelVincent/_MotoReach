import { Route } from "react-router-dom";
import MechanicLayout from "../../layouts/MechanicLayout";
import MechanicDashboard from "../../pages/mechanic/MechanicDashboard";

function MechanicRoute() {
    return (
        <Route element={<MechanicLayout />}>
            <Route path="/mechanic" element={<MechanicDashboard />} />
        </Route>
    );
}

export default MechanicRoute;


