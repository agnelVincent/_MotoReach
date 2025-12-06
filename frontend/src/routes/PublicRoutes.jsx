import { Routes, Route, Navigate } from "react-router-dom"
import Register from "../pages/auth/Register"
import VerifyOTP from "../pages/auth/VerifyOTP"
import Login from "../pages/auth/Login"
import LandingPage from "../pages/landing_page/LandingPage"

function PublicRoutes() {
  return (
    <>
      <Route path='/register' element ={<Register/>}/>
      <Route path="/verify-otp" element = {<VerifyOTP/>}/>
      <Route path="/login" element = {<Login/>}/>
      <Route path="/" element = {<LandingPage/>}/>

      <Route path="*" element={<div>404 | Not Found</div>} />
    </>
  )
}

export default PublicRoutes
