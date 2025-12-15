import { Route } from "react-router-dom";
import UserLayout from "../../layouts/UserLayout";
import UserHome from "../../pages/user/UserHome";
import UserProfile from "../../pages/user/UserProfile";

function UserRoute() {
    return (
        <Route path="user" element={<UserLayout />}>
            <Route index element={<UserHome />} />
            <Route path="home" element={<UserHome />} />
            <Route path='profile' element={<UserProfile />} />
        </Route>
    );
}

export default UserRoute;



