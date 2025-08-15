import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentReports.css";
import axiosInstance from "../../../../api/axiosInstance";

const StudentReports = () => {
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance
      .get("/student/getReports", { withCredentials: true })
      .then((res) => {setExams(res.data.data || []);})
      .catch(() => setExams([]));
  }, []);

  return (
    <div className="student-container">
      <h1 className="student-page-heading">&#128203; Exam Reports</h1>

      <div className="student-exam-list">
        {exams.length === 0 ? (
          <p className="student-no-exam-text">No exams found.</p>
        ) : (
          exams.map((exam, index) => (
            <div className="student-exam-box" key={exam.examId}>
              <div className="student-top-row">
                <div className="student-exam-number">{index + 1}.</div>
                <div className="student-exam-detail">
                  <h2 className="student-exam-title">{exam.title}</h2>
                  <p className="student-exam-desc">By Professor {exam.professor}</p>
                </div>
                <span className="student-exam-date">
                  {new Date(exam.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })}
                </span>
              </div>

              <div className="student-button-row">
                <button
                  className="student-btn student-normal-btn"
                  onClick={() =>
                    navigate(`/student-dashboard/reports/responses/${exam.examId}`)
                  }
                >
                  View Question Paper
                </button>
                <span className="student-btn student-blue-btn" >
                  Score: {exam.score}/{exam.totalMarks}
                </span>
                
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentReports;
