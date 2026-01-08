import { Route } from "react-router-dom";
import WorkshopLayout from "../../layouts/WorkshopLayout";
import WorkshopDashboard from "../../pages/workshop/WorkshopDashboard";
import WorkshopProfile from "../../pages/workshop/WorkshopProfile";
import WorkshopPendingPage from "../../pages/workshop/WorkshopPendingPage";
import WorkshopRequestList from "../../pages/workshop/WorkshopRequestList";
import WorkshopMechanicManager from "../../pages/workshop/WorkshopMechanicManager";

function WorkshopRoute() {
    return (
        <Route path="workshop" element={<WorkshopLayout />}>
            <Route index element={<WorkshopDashboard />} />
            <Route path="profile" element={<WorkshopProfile />} />
            <Route path="pending" element={<WorkshopPendingPage />} />
            <Route path="requests" element={<WorkshopRequestList />} />
            <Route path="team" element={<WorkshopMechanicManager />} />
        </Route>
    );
}

export default WorkshopRoute;
