import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

import axiosInstance from '../../api/axiosInstance';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const GoogleLoginButton = () => {
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLoginSuccess = async (credentialResponse) => {
    

    const decoded = jwtDecode(credentialResponse.credential);
    const { name, email } = decoded;

    try {
      const res = await axiosInstance.post('/user/googleLogin', { name, email });
     

      setUser(res.data.user);

      if (res.data.user.role === "professor") {
        navigate('/teacher-dashboard');
      } else {
        navigate('/student-dashboard');
      }
    } catch (error) {
      console.error('Error sending data to backend:', error);
    }
  };

  const handleLoginError = () => {
    console.error('Login Failed');
  };

  return (
    <GoogleLogin
      onSuccess={handleLoginSuccess}
      onError={handleLoginError}
    />
  );
};

export default GoogleLoginButton;
