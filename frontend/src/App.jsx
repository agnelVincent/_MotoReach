import { BrowserRouter } from 'react-router-dom';
import './index.css';
import AppRoute from './routes/AppRoute';
import { Toaster } from 'react-hot-toast';



import ScrollToTop from './components/ScrollToTop';

function App() {
  return (

    <BrowserRouter>
      <ScrollToTop />
      <Toaster position="top-right" />
      <AppRoute />
    </BrowserRouter>

  )
}

export default App

