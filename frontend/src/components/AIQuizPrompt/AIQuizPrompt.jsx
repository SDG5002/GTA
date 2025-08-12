import { useState } from "react";
import "./AIQuizPrompt.css";
import { toast } from "react-hot-toast";
import axiosInstance from "../../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { HiSparkles } from "react-icons/hi";

const AIQuizPrompt = ({ onClose }) => {
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState("");
  const [mcqCount, setMcqCount] = useState("");
  const [numericalCount, setNumericalCount] = useState("");
  const [difficulty, setDifficulty] = useState("2");
  const [optionsCount, setOptionsCount] = useState("4");
  const [submit, setSubmit] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = () => {
    if (topic.trim() === "") {
      toast.error("Please enter a topic.");
      return;
    }

    const qCount = parseInt(questionCount) || 1;
    const mcq = mcqCount === "" ? 1 : parseInt(mcqCount);
    const numerical = numericalCount === "" ? 0 : parseInt(numericalCount);
    const opts = parseInt(optionsCount) || 4;

    if (qCount < 1) {
      toast.error("At least one question is required.");
      return;
    }
    if (mcq < 0) {
      toast.error("MCQ count cannot be negative.");
      return;
    }
    if (numerical < 0) {
      toast.error("Numerical count cannot be negative.");
      return;
    }
    if (mcq === 0 && numerical === 0) {
      toast.error("At least one MCQ or numerical question required.");
      return;
    }
    if (opts < 2 || opts > 5) {
      toast.error("Options must be between 2 and 5.");
      return;
    }
    if (mcq + numerical !== qCount) {
      toast.error("Total questions must equal MCQ + Numerical count.");
      return;
    }

    setSubmit(true);

    const data = {
      topic: topic.trim(),
      questionCount: qCount,
      mcqCount: mcq,
      numericalCount: numerical,
      difficulty: difficulty || 2,
      optionsCount: opts,
    };

    axiosInstance
      .post("/professor/aiGeneratedQuiz", { data }, { withCredentials: true })
      .then((res) => {
        navigate("/teacher-dashboard/set-exam", { state: res.data });
        setSubmit(false);
      })
      .catch((err) => {
        
        toast.error("Error generating AI quiz. Please try again.");
      });
  };

  return (
    <div className="ai-modal-overlay">
      {submit && (
        <div className="ai-loader-container-overlay" >
          <div className="ai-loader"></div>
        </div>
      )}

      <div className="ai-card">
        <h2>
          Meet with <span>AI Quiz Generator</span>
        </h2>
        <p>
          Why create quizzes manually when you can <strong>generate them with AI</strong>? 
          Provide your topic, choose the number of questions, and let our AI 
          create a customized quiz for you. Save time and focus on what matters.
        </p>

        <div className="ai-form-section">
          <textarea
            className="ai-textarea"
            placeholder="Enter your quiz topic...Ex.Newton's Laws of Motion for 5th standerd"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />

          <div className="ai-input-row">
            <div className="ai-input-group">
              <label>No. of Questions</label>
              <input
                type="number"
                min="1"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                placeholder="Default: 1"
              />
            </div>
          </div>

          <div className="ai-input-row">
            <div className="ai-input-group">
              <label>MCQs</label>
              <input
                type="number"
                min="0"
                value={mcqCount}
                onChange={(e) => setMcqCount(e.target.value)}
                placeholder="Default: 1"
              />
            </div>
            <div className="ai-input-group">
              <label>Numerical</label>
              <input
                type="number"
                min="0"
                value={numericalCount}
                onChange={(e) => setNumericalCount(e.target.value)}
                placeholder="Default: 0"
              />
            </div>
          </div>

          <div className="ai-input-row">
            <div className="ai-input-group">
              <label>Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="1">Easy</option>
                <option value="2">Medium</option>
                <option value="3">Hard</option>
              </select>
            </div>
            <div className="ai-input-group">
              <label>Options per Q</label>
              <input
                type="number"
                min="2"
                max="5"
                value={optionsCount}
                onChange={(e) => setOptionsCount(e.target.value)}
                placeholder="Default: 4"
              />
            </div>
          </div>
        </div>

        <div className="ai-btn-row">
          <button className="ai-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="ai-generate-btn" onClick={handleSubmit} disabled={submit}>
            <HiSparkles className="ai-icon" /> Create Your AI Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIQuizPrompt;
