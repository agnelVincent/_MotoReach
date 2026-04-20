import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile } from './redux/slices/ProfileSlice';
import './index.css';
import AppRoute from './routes/AppRoute';
import { Toaster } from 'react-hot-toast';



import ScrollToTop from './components/ScrollToTop';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getProfile());
    }
  }, [dispatch, isAuthenticated]);

  return (

    <BrowserRouter>
      <ScrollToTop />
      <Toaster position="top-right" />
      <AppRoute />
    </BrowserRouter>

  )
}

export default App

