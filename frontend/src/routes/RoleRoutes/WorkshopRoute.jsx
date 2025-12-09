import { Route } from "react-router-dom";
import WorkshopLayout from "../../layouts/WorkshopLayout";
import WorkshopDashboard from "../../pages/workshop/WorkshopDashboard";

function WorkshopRoute() {
    return (
        <Route element={<WorkshopLayout />}>
            <Route path="/workshop" element={<WorkshopDashboard />} />
        </Route>
    );
}

export default WorkshopRoute;

