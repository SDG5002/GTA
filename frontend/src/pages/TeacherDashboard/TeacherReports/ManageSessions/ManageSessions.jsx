import { useEffect, useState } from "react";
import axiosInstance from "../../../../api/axiosInstance";
import { useParams } from 'react-router-dom';
import "./ManageSessions.css";
import toast from "react-hot-toast";
import { MdEditNote } from "react-icons/md";

const ManageSessions = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [killSessionEmail, setKillSessionEmail] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { examId } = useParams();

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get(`/professor/manageSessions/${examId}`, { withCredentials: true })
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load sessions");
        setLoading(false);
      });
  }, [examId]);

  const handleKillClick = (email) => {
    setKillSessionEmail(email);
    setModalOpen(true);
  };

  const handleConfirmKill = () => {
    axiosInstance
      .post(
        `/professor/killSession`, 
        { email: killSessionEmail, examId },
        { withCredentials: true }
      )
      .then(() => {
        setData((prev) => ({
          ...prev,
          sessions: prev.sessions.filter((s) => s.studentEmail !== killSessionEmail),
        }));
        setModalOpen(false);
        setKillSessionEmail(null);
      })
      .catch(() => toast.error("Failed to kill session"));
  };

  if (loading) return <div className="sessionpage-loading">Loading...</div>;
  if (error) return <div className="sessionpage-error">{error}</div>;

  return (
    <div className="sessionpage-container">
      <div className="sessionpage-header">
      <MdEditNote  className="manage-session-icon"/> <h1 className="">Manage Sessions</h1>
      </div>
      <h1 className="sessionpage-title">Title: {data?.examTitle || "Exam Sessions"}</h1>

      <table className="sessionpage-table">
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {data?.sessions?.length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                No active or Submitted sessions found.
              </td>
            </tr>
          )}
          {data?.sessions?.map((session) => (
            <tr key={session.studentEmail}>
              <td>{session.studentName}</td>
              <td>{session.studentEmail}</td>
              <td>
                <span
                  className={`sessionpage-status ${
                    session.status === "live"
                      ? "sessionpage-status-live"
                      : "sessionpage-status-submitted"
                  }`}
                >
                  {session.status}
                </span>
              </td>
              <td>
                {session.status === "live" ?
                  <button
                    className="sessionpage-kill-btn"
                    onClick={() => handleKillClick(session.studentEmail)}
                  >
                    Kill
                  </button>
                :
                <button
                    className="sessionpage-kill-btn"
                    onClick={() => handleKillClick(session.studentEmail)}
                  >
                    Drop
                  </button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalOpen && (
        <div className="sessionpage-modal-overlay">
          <div className="sessionpage-modal">
            <h2>Confirm Kill Session</h2>
            <p>Are you sure you want to kill this session?</p>
            <div className="sessionpage-modal-buttons">
              <button
                className="sessionpage-modal-btn sessionpage-modal-confirm"
                onClick={handleConfirmKill}
              >
                Yes, Kill
              </button>
              <button
                className="sessionpage-modal-btn sessionpage-modal-cancel"
                onClick={() => setModalOpen(false)}
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

export default ManageSessions;
