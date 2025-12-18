import { BrowserRouter } from 'react-router-dom';
import './index.css';
import AppRoute from './routes/AppRoute';
import WorkshopRequestList from './pages/workshop/WorkshopRequestList';



function App() {
  return (

      <BrowserRouter>
        <AppRoute />
      </BrowserRouter>

  )
}

export default App

