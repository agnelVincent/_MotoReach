import { BrowserRouter } from 'react-router-dom';
import './index.css';
import AppRoute from './routes/AppRoute';
import { Toaster } from 'react-hot-toast';
import { NotificationsProvider } from './context/NotificationsContext';

import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <NotificationsProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Toaster position="top-right" />
        <AppRoute />
      </BrowserRouter>
    </NotificationsProvider>
  )
}

export default App

