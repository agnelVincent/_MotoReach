import { Route } from "react-router-dom";
import MechanicLayout from "../../layouts/MechanicLayout";
import MechanicDashboard from "../../pages/mechanic/MechanicDashboard";
import MechanicProfile from "../../pages/mechanic/MechanicProfile";
import MechanicWorkshop from "../../pages/mechanic/MechanicWorkshop";

function MechanicRoute() {
    return (
        <Route path="mechanic" element={<MechanicLayout />}>
            <Route index element={<MechanicDashboard />} />
            <Route path="profile" element={<MechanicProfile />} />
            <Route path="workshop" element={<MechanicWorkshop />} />
        </Route>
    );
}

export default MechanicRoute;



