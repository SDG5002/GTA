import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../../../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import "./EditExam.css";
import toast from "react-hot-toast";

const EditExam = () => {
  const navigate=useNavigate();
  const { examId } = useParams();
  const [exam, setExam] = useState(null);

  useEffect(() => {
    axiosInstance
      .get(`/professor/getExam/${examId}`, { withCredentials: true })
      .then((res) => {
        setExam(res.data.exam);
        
      })
      .catch(() => alert("Failed to load exam."));
  }, [examId]);

  const handleChange = (id, key, value) => {
    setExam((prev) => {
      const updated = prev.questions.map((q) =>
        q._id === id ? { ...q, [key]: value } : q
      );
      return { ...prev, questions: updated };
    });
  };

  const handleSubmit = async () => {
    try {
      await axiosInstance.put(
        `/professor/updateAnswers/${examId}`,
        { questions: exam.questions },
        { withCredentials: true }
      );
      toast.success("Answers updated successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update answers.");
    }
  };

  const handleReRelease = async () => {
   
    try {
      await axiosInstance.put(`/professor/reReleaseResults/${examId}`, {exam},
        { withCredentials: true }
          );
      toast.success("Results re-released successfully.");
      navigate("/teacher-dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to re-release results.");
    }
  };

  if (!exam) return <div className="container"><p>Loading exam data...</p></div>;

  return (
    <div className="EditExam-container">
      <h1 className="exam-title">&#9999;&#65039; Edit Exam Answers</h1>

      <p className="exam-line"><strong>Title:</strong> {exam.title}</p>
      <p className="exam-line"><strong>Code:</strong> {exam.code}</p>

      <div className="queslist">
        {exam.questions.map((q, index) => (
          <div key={q._id} className="ques-box">
            <div className="ques-text">Q{index + 1}. {q.question}</div>
            <div className="edit-controls">
              <label className="control-label">Correct Answer:</label>
              {q.type === "MCQ" ? (
                <select
                  value={q.correctAnswer}
                  onChange={(e) => handleChange(q._id, "correctAnswer", e.target.value)}
                >
                  {q.options.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={q.correctAnswer}
                  onChange={(e) => handleChange(q._id, "correctAnswer", e.target.value)}
                />
              )}

              <div className="checkboxes">
                <label>
                  <input
                    type="checkbox"
                    checked={q.isDropped || false}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      handleChange(q._id, "isDropped", isChecked);
                      if (isChecked) handleChange(q._id, "isBonus", false);
                    }}
                  />
                  Drop Question
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={q.isBonus || false}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      handleChange(q._id, "isBonus", isChecked);
                      if (isChecked) handleChange(q._id, "isDropped", false);
                    }}
                  />
                  Bonus Marks
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
      

      <div className="edit-exam-buttons">

      <button className="btn rerun-btn" onClick={handleReRelease} >
         Re-Release the Results
      </button>
      </div>

    </div>
  );
};

export default EditExam;
