import { BrowserRouter } from 'react-router-dom';
import './index.css';
import AppRoute from './routes/AppRoute';



function App() {
  return (

      <BrowserRouter>
        <AppRoute />
      </BrowserRouter>

  )
}

export default App

