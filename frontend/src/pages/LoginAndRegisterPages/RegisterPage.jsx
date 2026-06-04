import { useState, useContext } from 'react';
import './AuthPage.css';
import axiosInstance from '../../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
  });

  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password.length < 5) {
      toast.error("Passwords must be at least 5 characters long.");
      return;
    }

    if (!formData.role) {
      toast.error('Please select a role.');
      return;
    }

    setIsSubmitting(true); 

    axiosInstance
      .post('/user/register', formData, { withCredentials: true })
      .then((res) => {
        toast.success("Registration successful!");
        const user = res.data.user;
        setUser(user);

        if (user.role === 'professor') {
          navigate('/teacher-dashboard');
        } else {
          navigate('/student-dashboard');
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.error || "Something went wrong during registration");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="auth-page">
      <img src="/images/loginImg.png" alt="loginImg" className="loginImg" />
      <div className="auth-card">
      <div className="auth-left">
         <h1>GTA</h1>
         <h2>Join Our Community</h2>
          <p>You can sign in to access with your existing account.</p>
          <div className="abstract-shapes"></div>
        </div>
         <div className="auth-right">
        
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input type="text" name="name" id="name" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" name="email" id="email" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" name="password" id="password" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select name="role" id="role" onChange={handleChange} required>
              <option value="">Select Role</option>
              <option value="student">Student</option>
              <option value="professor">Professor</option>
            </select>
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className='register-text'>
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
      </div>
    </div>
  );
}

export default RegisterPage;
