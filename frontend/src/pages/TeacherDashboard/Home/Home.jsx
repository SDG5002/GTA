import "./Home.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axiosInstance from "../../../api/axiosInstance";
import AIQuizPrompt from "../../../components/AIQuizPrompt/AIQuizPrompt";

function Home() {
  const navigate = useNavigate();

  const [modal, setModal] = useState(false);

  const [stats, setStats] = useState({
      totalExams: 0,
      totalSubmissions: 0,
      recentActivities: [],
      latestExam: null,
      emailId: null

    });

useEffect(() => {
    axiosInstance
      .get("/professor/getStats", { withCredentials: true })
      .then((res) => {
        setStats({
          totalExams: res.data.totalExams,
          totalSubmissions: res.data.totalSubmissions,
          recentActivities: res.data.recentActivities || [],
          latestExam: res.data.latestExam,
          emailId: res.data.emailId
        });
      })
      .catch((err) => {
        console.error("Failed to load stats:", err);
      });
}, []);


  const handleCreateExam = () => {
    navigate("/teacher-dashboard/set-exam");
  };

  const handleAiPrompt = () => {
   setModal(!modal);
  };



  return (
    <>
    {modal && <AIQuizPrompt onClose={() => setModal(false)} />}
    <div className="dashboard-wrapper">
      <div className="top-section">
        <div className="welcome-box">
          <div className="professor-header">
            <div className="professor-avatar">{"\uD83D\uDC68\u200D\uD83C\uDFEB"}</div>
            <div className="professor-details">
              <h2>Welcome, Professor {"\uD83D\uDC4B"}</h2>
              <p>Email ID : {stats.emailId}</p>
              
            </div>
          </div>
        </div>

        <div className="create-exam-box">
          <h1>AI Quiz Generator</h1>
          <p>Quickly create tailored quizzes with the power of AI - save time and engage your students effectively.</p>
          <div className="exam-gen-buttons">
          <button onClick={handleCreateExam}>Manual Quiz</button>
          <button onClick={handleAiPrompt}>AI Auto Quiz</button>

          </div>

        </div>

       
      </div>
       
      <div className="activity-box">
        <h3>{"\uD83D\uDCC5"} Recent Activity</h3>
        <ul>
          {stats.recentActivities.length === 0 && <p>Nothing here yet</p>}
          {stats.recentActivities.map((activity, index) => (
            <li key={index}>{activity.message }</li>
          ))}
        </ul>

        
      </div>

      <div className="stats-section">
        <div className="stats-box">
          <h3>{"\uD83D\uDCCA"} Quick Stats</h3>
          <div className="stats-cards">
            <div className="stat-card teacher-card-no">
               <p>Total Exams Created</p>
              <h4>{stats.totalExams}</h4>
             
            </div>
            <div className="stat-card teacher-card-no">
               <p>Total Submissions</p>
              <h4>{stats.totalSubmissions}</h4>
             
            </div>
             <div className="stat-card teacher-card-text">
               <p>Latest Exam</p>
              <h4>{stats.latestExam?.title}</h4>
              
              
            </div>
          </div>
        </div>
      </div>
    </div>

    </>
  );
}

export default Home;
