import { useState, useContext } from 'react';
import './AuthPage.css';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { AuthContext } from '../../context/AuthContext';
import GoogleLoginButton from '../../components/GoogleLogin/GoogleLogin';

function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    axiosInstance
      .post('/user/login', {
        email: formData.email,
        password: formData.password,
      })
      .then((res) => {
        const user = res.data.user;
        setUser(user);

        if (user.role === 'professor') {
          navigate('/teacher-dashboard');
        } else {
          navigate('/student-dashboard');
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Something went wrong while login');
      });
  };

  return (
    <div className="auth-bg">
      <img src="/images/loginImg.png" alt="loginImg" className="loginImg" />
      <div className="auth-card">
       
        <div className="auth-left">
          <h1>GTA</h1>
          <h2>Welcome back!</h2>
          <p>You can sign in to access with your existing account.</p>
          <div className="abstract-shapes"></div>
        </div>

        <div className="auth-right">
          <h2>Auth Login</h2>
          {error && <div className="form-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" name="email" id="email" onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input type="password" name="password" id="password" onChange={handleChange} required />
            </div>

            <button type="submit" className="btn-primary">Login</button>
          </form>

          <GoogleLoginButton label="Auth Login with Google" />

          <p className="register-text">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
