import { Route } from "react-router-dom";
import UserLayout from "../../layouts/UserLayout";
import UserHome from "../../pages/user/UserHome";
import UserProfile from "../../pages/user/UserProfile";

function UserRoute() {
    return (
        <Route element={<UserLayout />}>
            <Route path="/user" element={<UserHome />} />
            <Route path="/user/home" element={<UserHome />} />
            <Route path='user/profile' element={<UserProfile />} />
        </Route>
    );
}

export default UserRoute;



