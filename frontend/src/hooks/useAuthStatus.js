import { useSelector } from "react-redux"

export const useAuthStatus = () => {
    const {isAuthenticated, user} = useSelector(state=> state.auth)
    return{
        isAuthenticated,
        role : user?.role
    }
}
