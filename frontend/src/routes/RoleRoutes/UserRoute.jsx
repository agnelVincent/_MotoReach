import { Route } from "react-router-dom";
import UserLayout from "../../layouts/UserLayout";
import UserHome from "../../pages/user/UserHome";
import UserProfile from "../../pages/user/UserProfile";
import UserRequest from "../../pages/user/UserRequest";
import UserWorkshopNearby from "../../pages/user/UserWorkshopNearby";

function UserRoute() {
    return (
        <Route path="user" element={<UserLayout />}>
            <Route index element={<UserHome />} />
            <Route path="home" element={<UserHome />} />
            <Route path='profile' element={<UserProfile />} />
            <Route path="request" element={<UserRequest/>}/>
            <Route path="workshops-nearby" element={<UserWorkshopNearby/>} />
        </Route>
    );
}

export default UserRoute;



