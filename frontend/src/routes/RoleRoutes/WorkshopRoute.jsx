import { Route } from "react-router-dom";
import WorkshopLayout from "../../layouts/WorkshopLayout";
import WorkshopDashboard from "../../pages/workshop/WorkshopDashboard";
import WorkshopProfile from "../../pages/workshop/WorkshopProfile";

function WorkshopRoute() {
    return (
        <Route path="workshop" element={<WorkshopLayout />}>
            <Route index element={<WorkshopDashboard />} />
            <Route path="/workshop/profile" element={<WorkshopProfile/>}/>
        </Route>
    );
}

export default WorkshopRoute;



