import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const verifyOtp = ({ email, otp }) =>
  axios.create({ baseURL: API_URL }).post('/api/auth/verify-otp', { email, otp }).then((r) => r.data);

const resendOtp = (email) =>
  axios.create({ baseURL: API_URL }).post('/api/auth/resend-otp', { email }).then((r) => r.data);

export default { verifyOtp, resendOtp };
