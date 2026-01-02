import { BrowserRouter } from 'react-router-dom';
import './index.css';
import AppRoute from './routes/AppRoute';
import WorkshopRequestList from './pages/workshop/WorkshopRequestList';
import { Toaster } from 'react-hot-toast';



function App() {
  return (

    <BrowserRouter>
      <Toaster position="top-right" />
      <AppRoute />
    </BrowserRouter>

  )
}

export default App

