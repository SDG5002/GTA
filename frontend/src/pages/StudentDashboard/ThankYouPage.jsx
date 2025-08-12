import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './ThankYouPage.css';

const ThankYouPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/student-dashboard"); 
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="thankyou-container">
      <div className="thankyou-card">
        <h1>{"\u{1F389} Thank You!"}</h1>
        <p>Your exam has been submitted successfully.</p>
        <p>You'll receive your score via email.</p>
        <div className="loader"></div>
      </div>
    </div>
  );
};

export default ThankYouPage;
