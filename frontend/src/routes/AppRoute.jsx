import { BrowserRouter, Routes } from "react-router-dom"
import PublicRoutes from "./PublicRoutes"


function AppRoute() {
  return (
    <Routes>
        {PublicRoutes()}
    </Routes>
  )
}

export default AppRoute


