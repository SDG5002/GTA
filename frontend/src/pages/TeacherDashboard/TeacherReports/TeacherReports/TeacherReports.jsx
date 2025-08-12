import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TeacherReports.css";
import axiosInstance from "../../../../api/axiosInstance";

const TeacherReports = () => {
  const [exams, setExams] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance
      .get("/professor/getExams", { withCredentials: true })
      .then((res) => {
        setExams(res.data.exams || []);
      })
      .catch(() => setExams([]));
  }, []);

  const handleDelete = async () => {
    await axiosInstance
      .delete(`/professor/deleteExam/${selectedExam}`, {
        withCredentials: true,
      })
      .then((res) => {
        setExams((prev) => prev.filter((exam) => exam.id !== selectedExam));
        setModalOpen(false);
        setSelectedExam(null);
      })
      .catch((err) => console.log(err));
  };

  return (
    <div className="teacher-report-container">
      <h1 className="teacher-report-page-heading">&#128203; Exam Reports</h1>

      <div className="teacher-report-exam-list">
        {exams.length === 0 ? (
          <p className="teacher-report-no-exam-text">No exams found.</p>
        ) : (
          exams.map((exam, index) => (
            <div className="teacher-report-exam-box" key={exam.id}>
              <div className="teacher-report-top-row">
                <span className="teacher-report-exam-number">{index + 1}.</span>
                <div className="teacher-report-exam-detail">
                  <h2 className="teacher-report-exam-title">{exam.title}</h2>
                  <p className="teacher-report-exam-desc">{exam.description}</p>
                </div>
                <span className="teacher-report-exam-date">
                  {new Date(exam.scheduledAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })} - {new Date(exam.closeAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })}
                </span>
              </div>

              <div className="teacher-report-button-row">
                <button
                  className="teacher-report-btn teacher-report-normal-btn"
                  onClick={() =>
                    navigate(
                      `/teacher-dashboard/reports/questionPaper/${exam.id}`
                    )
                  }
                >
                  View Question Paper
                </button>
                <button
                  className="teacher-report-btn teacher-report-edit-ans-btn"
                  onClick={() =>
                    navigate(`/teacher-dashboard/reports/EditExam/${exam.id}`)
                  }
                >
                   Edit Answers
                </button>
                 <button
                  className="teacher-report-btn teacher-report-edit-ans-btn"
                  onClick={() =>
                    navigate(`/teacher-dashboard/reports/ManageSessions/${exam.id}`)
                  }
                >
                   Manage Sessions
                </button>
                <button
                  className="teacher-report-btn teacher-report-delete-btn"
                  onClick={() => {
                    setSelectedExam(exam.id);
                    setModalOpen(true);
                  }}
                >
                  Delete Exam
                </button>
                <button
                  className="teacher-report-btn teacher-report-blue-btn"
                  onClick={() =>
                    navigate(
                      `/teacher-dashboard/reports/analysis/${exam.id}`
                    )
                  }
                >
                  See Analysis
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="teacher-report-delete-exam-modal-overlay">
          <div className="teacher-report-delete-exam-modal">
            <h2>Confirm Deletion</h2>
            <p>
              <strong>This action is irreversible.</strong>
              <br />
              All associated reports and marks will be lost.
              <br />
              <em>Make sure you have downloaded the response PDF.</em>
            </p>
            <div className="teacher-report-delete-exam-modal-buttons">
              <button className="teacher-report-btn teacher-report-red-btn" onClick={handleDelete}>
                Yes, Delete
              </button>
              <button
                className="teacher-report-btn teacher-report-gray-btn"
                onClick={() => {
                  setModalOpen(false);
                  setSelectedExam(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherReports;
