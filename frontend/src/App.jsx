import { BrowserRouter } from 'react-router-dom';
import './index.css';
import AppRoute from './routes/AppRoute';



function App() {
       console.log("CLIENT ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID); 
  return (

      <BrowserRouter>
        <AppRoute />
      </BrowserRouter>

  )
}

export default App

