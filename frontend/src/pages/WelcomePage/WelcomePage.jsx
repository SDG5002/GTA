import Navbar from '../../components/Navbar/Navbar';
import './WelcomePage.css';
import {  useNavigate } from 'react-router-dom';


function WelcomePage() {
  const navigate=useNavigate();
  return (     
      <>
      <Navbar/>
       <div className="main-box">
      <div className="top-part">
        <div className="left-side">
          <h1>Welcome to<br /> GOA TESTING AGENCY</h1>
          <p>Your trusted online exam portal for professors and students. Conduct, manage, and attend exams securely and efficiently.</p>
          <button className="big-button" onClick={() => navigate('/login')}>Explore Portal</button>
        </div>

        <div className="right-side">
          <img src="images/bulb.png" alt="Hero Image" />
        </div>
      </div>

      <div className="middle-part">
        <h2>Why Choose GTA?</h2>
        <div className="all-cards">
          <div className="card">
            <img src="images/exam1.jpg" alt="Secure Exams" />
            <h3>Secure Online Exams</h3>
            <p>End-to-end encryption and monitoring tools to ensure fair and secure exam environments for everyone.</p>
          </div>
          <div className="card">
            <img src="images/exam2.png" alt="Professors & Students" />
            <h3>For Professors & Students</h3>
            <p>Easy-to-use dashboards for both faculty and students to manage exams, results, and schedules seamlessly.</p>
          </div>
          <div className="card">
            <img src="images/exam3.jpg" alt="Analytics" />
            <h3>Result Analytics</h3>
            <p>Smart analytics and result management to track academic performance and exam insights effortlessly.</p>
          </div>
          
        </div>
      </div>
     <div className="welcome-ai-box">
      

    
        <div className="welcome-ai-info">
           <h1 >Customizable Auto<br></br><span> AI Quiz Generator</span></h1>
       
        <ul>
          <li> Save hours of manual work with instant AI-powered quiz generation.</li>
          <li> Create quizzes on any topic in seconds.</li>
          <li> Fully customizable - choose question types, difficulty levels, and number of questions.</li>
          <li> Adapts to your audience for accurate, engaging, and time-efficient assessments.</li>
        </ul>
      </div>
      
        <div className="welcome-ai-img">
          <img src="images/ai.png" alt="AI Image" />
        </div>

      </div>


      <div className="join-box">
        <div className="join-info">
          <h2>Get Started with GTA</h2>
          <p>Join the Goa Testing Agency today and make online assessments smarter and simpler for your institution.</p>
          <button className="big-button" onClick={() => navigate('/register')}>Join Now</button>
        </div>
      </div>
    </div>
    </>
  );
}

export default WelcomePage;
