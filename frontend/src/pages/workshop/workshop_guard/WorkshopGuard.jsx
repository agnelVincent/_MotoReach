import { useSelector } from "react-redux"
import WorkshopPendingPage from "../WorkshopPendingPage"
import WorkshopRejectedPage from "../WorkshopRejectedPage"

const WorkshopGuard = ({children}) => {
    const {user} = useSelector(state => state.auth)
    console.log(user)
    if(user && user.role == 'workshop_admin' && user.workshop_status){
        const status = user.workshop_status
        console.log('hi')
        console.log(status)
        if(status === 'PENDING'){
            return <WorkshopPendingPage/>
        }

        if(status === 'REJECTED'){
            return <WorkshopRejectedPage />
        }

        if(status === 'APPROVED'){
        return <>{children}</>
        }

    }
    return <>404</>
}

export default WorkshopGuard