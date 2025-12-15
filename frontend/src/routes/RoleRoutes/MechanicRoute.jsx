import { Route } from "react-router-dom";
import MechanicLayout from "../../layouts/MechanicLayout";
import MechanicDashboard from "../../pages/mechanic/MechanicDashboard";
import MechanicProfile from "../../pages/mechanic/MechanicProfile";

function MechanicRoute() {
    return (
        <Route path="mechanic" element={<MechanicLayout />}>
            <Route index element={<MechanicDashboard />} />
            <Route path="profile" element={<MechanicProfile/>}/>
        </Route>
    );
}

export default MechanicRoute;



