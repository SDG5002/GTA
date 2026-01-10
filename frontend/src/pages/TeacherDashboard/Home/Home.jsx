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

  return (
    <>
      {modal && <AIQuizPrompt onClose={() => setModal(false)} />}

      <div className="dashboard-wrapper">

        {/* TOP SECTION */}
        <div className="top-section">
          <div className="welcome-box">
            <div className="professor-header">
              <div className="professor-avatar">👨‍🏫</div>
              <div className="professor-details">
                <h2>Welcome, Professor 👋</h2>
                <p>Email ID : {stats.emailId}</p>
              </div>
            </div>
          </div>

          <div className="create-exam-box">
            <h1>AI Quiz Generator</h1>
            <p>
              Quickly create tailored quizzes with the power of AI – save time
              and engage your students effectively.
            </p>
            <div className="exam-gen-buttons">
              <button onClick={() => navigate("/teacher-dashboard/set-exam")}>
                Manual Quiz
              </button>
              <button onClick={() => setModal(true)}>
                AI Auto Quiz
              </button>
            </div>
          </div>
        </div>

        {/* ACTIVITY */}
        <div className="activity-box">
          <h3>📅 Recent Activity</h3>
          <ul>
            {stats.recentActivities.length === 0 && <p>Nothing here yet</p>}
            {stats.recentActivities.map((activity, index) => (
              <li key={index}>{activity.message}</li>
            ))}
          </ul>
        </div>

        {/* STATS */}
        <div className="stats-section">
          <div className="stats-box">
            <h3>📊 Quick Stats</h3>

            <div className="stats-cards">
              <div className="stat-card">
                <p>Total Exams Created</p>
                <h4>{stats.totalExams}</h4>
              </div>

              <div className="stat-card">
                <p>Total Submissions</p>
                <h4>{stats.totalSubmissions}</h4>
              </div>

              <div className="stat-card">
                <p>Latest Exam</p>
                <h4 className="latest-text">
                  {stats.latestExam?.title || "—"}
                </h4>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
