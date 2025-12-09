import { Route } from "react-router-dom";
import WorkshopLayout from "../../layouts/WorkshopLayout";
import WorkshopDashboard from "../../pages/workshop/WorkshopDashboard";

function WorkshopRoute() {
    return (
        <Route path="workshop" element={<WorkshopLayout />}>
            <Route index element={<WorkshopDashboard />} />
        </Route>
    );
}

export default WorkshopRoute;


