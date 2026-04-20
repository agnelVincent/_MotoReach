import { Route, Routes } from "react-router-dom";
import PublicRoutes from "./PublicRoutes";
import PrivateRoutes from "./PrivateRoutes";
import NotFound from "../components/NotFound";

function AppRoute() {
    return (
        <Routes>
            {PublicRoutes()}
            {PrivateRoutes()}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default AppRoute;
