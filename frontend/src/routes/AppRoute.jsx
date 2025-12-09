import { Route, Routes } from "react-router-dom";
import PublicRoutes from "./PublicRoutes";
import PrivateRoutes from "./PrivateRoutes";

function AppRoute() {
    return (
        <Routes>
            {PublicRoutes()}
            {PrivateRoutes()}
            <Route path="*" element={<div>404 | Not Found</div>} />
        </Routes>
    );
}

export default AppRoute;
