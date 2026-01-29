import axios from 'axios';

const BASE_URL = '/api';
const ACCESS_TOKEN_KEY = 'accessToken'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

const refreshClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true
});


axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url && (
        originalRequest.url.includes('login') ||
        originalRequest.url.includes('register') ||
        originalRequest.url.includes('verify-otp')
      )) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }


      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 Attempting to refresh access token...');

        const refreshResponse = await refreshClient.post("accounts/auth/token/refresh/");

        if (refreshResponse.data && refreshResponse.data.access) {
          const newAccessToken = refreshResponse.data.access;

          localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);

          axiosInstance.defaults.headers["Authorization"] = "Bearer " + newAccessToken;

          originalRequest.headers["Authorization"] = "Bearer " + newAccessToken;

          console.log('✅ Token refreshed successfully');

          processQueue(null, newAccessToken);

          return axiosInstance(originalRequest);
        } else {
          throw new Error('No access token in refresh response');
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);

        processQueue(refreshError, null);

        localStorage.removeItem(ACCESS_TOKEN_KEY);

        if (window.location.pathname !== '/login') {
          console.log('🔐 Redirecting to login...');
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);



export default axiosInstance;