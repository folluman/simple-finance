import axios from 'axios'

const api = axios.create({
    baseURL: '/',
    withCredentials: true,
})

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const isAuthRoute = 
        error.config.url.includes('/api/users/login') || 
        error.config.url.includes('/api/users/forgot-password') ||
        error.config.url.includes('/api/users/reset-password');

    if (error.response && error.response.status === 401 && !isAuthRoute) {
  
      console.log('Token expirado. Fazendo logout...');

      window.location.reload();
    }
    
    return Promise.reject(error);
  }
);

export default api;