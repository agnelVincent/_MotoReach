import { Route } from "react-router-dom";
import MechanicLayout from "../../layouts/MechanicLayout";
import MechanicDashboard from "../../pages/mechanic/MechanicDashboard";
import MechanicProfile from "../../pages/mechanic/MechanicProfile";

function MechanicRoute() {
    return (
        <Route element={<MechanicLayout />}>
            <Route path="/mechanic" element={<MechanicDashboard />} />
            <Route path="/mechanic/profile" element={<MechanicProfile/>}/>
        </Route>
    );
}

export default MechanicRoute;



