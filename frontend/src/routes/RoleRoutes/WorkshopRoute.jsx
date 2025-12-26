import { Route } from "react-router-dom";
import WorkshopLayout from "../../layouts/WorkshopLayout";
import WorkshopDashboard from "../../pages/workshop/WorkshopDashboard";
import WorkshopProfile from "../../pages/workshop/WorkshopProfile";
import WorkshopPendingPage from "../../pages/workshop/WorkshopPendingPage";

function WorkshopRoute() {
    return (
        <Route path="workshop" element={<WorkshopLayout />}>
            <Route index element={<WorkshopDashboard />} />
            <Route path="profile" element={<WorkshopProfile />} />
            <Route path="pending" element={<WorkshopPendingPage />} />
        </Route>
    );
}

export default WorkshopRoute;



