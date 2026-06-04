import { useEffect, useState, useRef } from "react";
import "./SetExam.css";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useLocation } from "react-router-dom";
import { RxCross2 } from "react-icons/rx";
import Loader from "../../../components/Loader/Loader";
import toast from "react-hot-toast";

function SetExam() {
  const [showModal, setShowModal] = useState(false);
  const [examSecurity, setExamSecurity] = useState({ code: "", password: "" });
  const [error, setError] = useState("");
  
  const [submit,setSubmit]=useState(false);
  const navigate = useNavigate();

  const location=useLocation();
  

  const questionRefs = useRef([]);

  const autoResize = (textarea) => {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  };

  const [questions, setQuestions] = useState([
    {
      question: "",
      type: "MCQ",
      options: ["", "", ""],
      correctAnswer: "",
      marks: 4,
      negativeMarks: -1,
      unattemptedMarks: 0,
       image: null 
    },
  ]);

useEffect(() => {
  if (location.state?.questions) {
    const formattedQuestions = location.state.questions.map((q) => ({
      question: q.question,
      type: q.type,
      options: q.options,
      correctAnswer: q.answer,
      marks: 4,
      negativeMarks: -1,
      unattemptedMarks: 0,
      image: null
    }));
    setQuestions(formattedQuestions);
  }
}, [location.state]);



  // 🔥 AUTO-RESIZE WHEN AI / PREFILLED QUESTIONS LOAD
  useEffect(() => {
    questionRefs.current.forEach((textarea) => {
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";
      }
    });
  }, [questions]);


  const [examInfo, setExamInfo] = useState({
    title: location.state?.title || "",
    description:location.state?.description || "",
    scheduledAt: "",
    closeAt: "",
    duration: "",
    totalMarks: 0,
    correctMarks: 4,
    incorrectMarks: -1,
    unattemptedMarks: 0,
  }); 

  const handleQuestionChange = (index, field, value) => {
     
  
    const updated = [...questions];
   
    updated[index][field] = value;
    if(field==="type"){
      updated[index].options=["", ""];
      
    }
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const addOption = (qIndex) => {
    const updated = [...questions];
    if (updated[qIndex].options.length < 5) {
      updated[qIndex].options.push("");
      setQuestions(updated);
    }
  };

  const removeOption = (qIndex) => {
    const updated = [...questions];
    updated[qIndex].options.pop();
    setQuestions(updated);
  }
  const handleRemoveQuestion= (index) =>{
    const updated = [...questions];
    updated.splice(index,1);
    setQuestions(updated);
    
  }

  const handleQImageChange = (index, e) => {
        const updated = [...questions];
        
        updated[index].image =e.target.files[0];
      
//files is not a single file — it's a FileList (like an array).
// Even if the input allows only one file, it still comes as a list. hence indexing
        setQuestions(updated);
  }
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        type: "MCQ",
        options: ["", "", ""],
        correctAnswer: "",
        marks: examInfo.correctMarks,
        negativeMarks: examInfo.incorrectMarks,
        unattemptedMarks: examInfo.unattemptedMarks,
      },
    ]);
  };

 const validateExamData = () => {
  if (!examInfo.title.trim()) return "Exam title is required.";
  if (!examInfo.description.trim()) return "Exam description is required.";
  if (!examInfo.scheduledAt.trim()) return "Scheduled start time is required.";
  if (!examInfo.closeAt.trim()) return "Close time is required.";
  if (!examInfo.duration) return "Duration is required.";
  if (!examSecurity.code.trim()) return "Exam code is required.";
  if (!examSecurity.password.trim()) return "Password is required.";

  const scheduled = new Date(examInfo.scheduledAt);
  const close = new Date(examInfo.closeAt);

  if (scheduled >= close) return "Close time must be after scheduled time";
  if (scheduled <= new Date()) return "Scheduled time must be in the future";

  const diffInMinutes = Math.floor((close - scheduled) / (1000 * 60));
  if (examInfo.duration > diffInMinutes)
    return "Duration exceeds the time between Scheduled At and Close At";

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!String(q.question || "").trim()) return `Question ${i + 1} is required.`;

    if (q.type === "MCQ") {
      if (q.options.some((opt) => !String(opt || "").trim()))
        return `All options must be filled for Question ${i + 1}.`;

      if (!String(q.correctAnswer || "").trim())
        return `Correct answer is required for Question ${i + 1}.`;
    } else if (q.type === "NAT") {
      if (!String(q.correctAnswer || "").trim())
        return `Correct numerical answer is required for Question ${i + 1}.`;
    }
  }

  return null;
};

  const handleSubmit = () => {
    const validationError = validateExamData();
    if (validationError) {
      setError(validationError);
      return;
    }

    if(!questions.length){
      setError("Atleast One question required");
      return;
    }

      const total = questions.reduce((acc, curr) => acc + (curr.marks || 0), 0);

     // Convert scheduledAt and closeAt from local form value to UTC
     //The issue that when i deploy it on render its server runs in diff region so it dont know the what local time means and mongo stores UTC by converting wrongly
      const scheduledUTC = new Date(examInfo.scheduledAt).toISOString();
      const closeUTC = new Date(examInfo.closeAt).toISOString();

      const updatedExamInfo = {
        ...examInfo,
        scheduledAt: scheduledUTC,
        closeAt: closeUTC,
        totalMarks: total,
        code: examSecurity.code,
        password: examSecurity.password
      };

    setExamInfo(updatedExamInfo);
    

    const formData = new FormData();
    formData.append("examInfo", JSON.stringify(updatedExamInfo));
        //FormData only stores string or file values — it can't store JS objects directly.So we use json.stringify later on backend it will be parsed as the json.parse()
        //Normal JSON can only handle text — no actual binary file data.
        //FormData is designed for multipart/form-data requests, which lets you send both
        //JSON-like fields and actual files in one go (exactly how HTML file uploads work).//HEnce we used the FormData object
        // Append each question's data & file
    questions.forEach((q, i) => {
          formData.append(`questions${i}`, JSON.stringify({
            question: q.question,
            type: q.type,
            options: q.options,
            correctAnswer: q.correctAnswer,
            marks: q.marks,
            negativeMarks: q.negativeMarks,
            unattemptedMarks: q.unattemptedMarks
          }));

          if (q.image) {
            formData.append(`images${i}`, q.image); 
          }
        });

        setSubmit(true);
        axiosInstance
            .post("/professor/uploadExam", formData, {
               headers: { "Content-Type": "multipart/form-data" },
               withCredentials: true
              })
            .then(()=>{
              setSubmit(false);
              navigate("/teacher-dashboard");
            })
            .catch((err)=>{
              setSubmit(false);
               console.log(err.response.data.error)
                setError(err.response?.data?.error || "Something went wrong");
            
            });

  };

  return (
    <div className="set-exam-wrapper">
      {submit && <><Loader/></>}
      <div className="set-exam-container">
        
        {/* Header Card */}
        <div className="form-header-card">
          <div className="form-header-accent"></div>
          <input
            type="text"
            className="form-title-input"
            placeholder="Exam Title"
            value={examInfo.title}
            onChange={(e) =>
              setExamInfo({ ...examInfo, title: e.target.value })
            }
            required
          />
          <textarea
            className="form-description-input"
            placeholder="Exam description"
            value={examInfo.description}
            onChange={(e) =>
              setExamInfo({ ...examInfo, description: e.target.value })
            }
            required
          />
        </div>

        {/* Exam Settings Card */}
        <div className="form-card">
          <div className="time-info-grid">
            <div className="time-info-item">
              <label>Scheduled At</label>
              <input
                type="datetime-local"
                value={examInfo.scheduledAt}
                onChange={(e) =>
                  setExamInfo({ ...examInfo, scheduledAt: e.target.value })
                }
              />
            </div>

            <div className="time-info-item">
              <label>Close At</label>
              <input
                type="datetime-local"
                value={examInfo.closeAt}
                onChange={(e) =>
                  setExamInfo({ ...examInfo, closeAt: e.target.value })
                }
              />
            </div>

            <div className="time-info-item">
              <label>Duration (minutes)</label>
              <input
                type="number"
                min="1"
                value={examInfo.duration}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value > 0 || e.target.value === "") {
                    setExamInfo({ ...examInfo, duration: value });
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Questions */}
        {questions.map((q, index) => (
          <div key={index} className="form-card question-card">
            <div className="question-header">
              <div className="question-input-wrapper">
                <span className="question-number">Q{index + 1}.</span>

                <textarea
                  ref={(el) => (questionRefs.current[index] = el)}
                  className="question-input"
                  placeholder="Enter your question here..."
                  value={q.question}
                  onChange={(e) => {
                    handleQuestionChange(index, "question", e.target.value);
                    autoResize(e.target);
                  }}
                  rows={1}
                  required
                />
              </div>

              <div className="question-actions">
                <button
                  type="button"
                  className="icon-btn image-btn"
                  onClick={() => document.getElementById(`image-input-${index}`).click()}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </button>
                <select
                  className="question-type-select"
                  value={q.type}
                  onChange={(e) =>
                    handleQuestionChange(index, "type", e.target.value)
                  }
                >
                  <option value="MCQ">Multiple choice</option>
                  <option value="NAT">Numerical</option>
                </select>
                {questions.length > 1 && (
                  <button
                    type="button"
                    className="icon-btn delete-btn"
                    onClick={() => handleRemoveQuestion(index)}
                  >
                    <RxCross2 size={20} />
                  </button>
                )}
              </div>
            </div>

            <input
              id={`image-input-${index}`}
              type="file"
              className="hidden-file-input"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                  if (!allowedTypes.includes(file.type)) {
                    toast.error("Invalid file type. Only image files are allowed.");
                    e.target.value = ""; 
                    return;
                  }
                  handleQImageChange(index, e); 
                }
              }}
            />

            {q.image && (
              <div className="image-preview">
                <span className="image-name">{q.image.name}</span>
              </div>
            )}

            {q.type === "MCQ" && (
              <div className="options-container">
                {q.options.map((opt, i) => (
                  <div key={i} className="option-row">
                    <div className="radio-circle"></div>
                    <input
                      type="text"
                      className="option-input"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) =>
                        handleOptionChange(index, i, e.target.value)
                      }
                      required
                    />
                  </div>
                ))}

                <div className="options-controls">
                  <button
                    type="button"
                    className="text-btn"
                    onClick={() => addOption(index)}
                    disabled={q.options.length >= 5}
                  >
                    Add option
                  </button>
                  <span className="separator">or</span>
                  <button
                    type="button"
                    className="text-btn"
                    onClick={() => removeOption(index)}
                    disabled={q.options.length <= 2}
                  >
                    Remove option
                  </button>
                </div>

                <div className="correct-answer-section">
                  <label className="correct-answer-label">Correct Answer</label>
                  <select
                    className="correct-answer-select"
                    value={q.correctAnswer}
                    required
                    onChange={(e) =>
                      handleQuestionChange(index, "correctAnswer", e.target.value)
                    }
                  >
                    <option value="">Select correct option</option>
                    {q.options.map((opt, i) => (
                      <option key={i} value={opt}>
                        Option {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {q.type === "NAT" && (
              <div className="numerical-answer-section">
                <label className="numerical-answer-label">Correct Answer</label>
                <input
                  type="number"
                  className="numerical-answer-input"
                  placeholder="Enter correct numerical answer"
                  value={q.correctAnswer}
                  onChange={(e) => {
                    const value = e.target.value;
        
                    if (value === "" || !isNaN(value)) {
                      handleQuestionChange(index, "correctAnswer", value);
                    }
                  }}
                  required
                />
              </div>
            )}

            <div className="question-footer">
              <div className="marking-scheme-compact">
                <div className="mark-item">
                  <label>Marks</label>
                  <input
                    type="number"
                    value={q.marks}
                    onChange={(e) =>
                      handleQuestionChange(index, "marks", +e.target.value)
                    }
                    required
                  />
                </div>
                <div className="mark-item">
                  <label>Negative</label>
                  <input
                    type="number"
                    value={q.negativeMarks}
                    onChange={(e) =>
                      handleQuestionChange(index, "negativeMarks", +e.target.value)
                    }
                    required
                  />
                </div>
                <div className="mark-item">
                  <label>Unattempted</label>
                  <input
                    type="number"
                    value={q.unattemptedMarks}
                    onChange={(e) =>
                      handleQuestionChange(index, "unattemptedMarks", +e.target.value)
                    }
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add Question Button */}
        <div className="add-question-container">
          <button type="button" className="add-question-btn" onClick={addQuestion}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Add Question
          </button>
        </div>

        {/* Submit Button */}
        <div className="submit-container">
          <button
            type="button"
            className="submit-exam-btn"
            onClick={() => setShowModal(true)}
            disabled={submit}
          >
            Submit Exam
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-title">Set Exam Security</h3>

              {error && <div className="error-message">{error}</div>}

              <div className="modal-field">
                <label>Exam Code</label>
                <input
                  type="text"
                  placeholder="Enter exam code"
                  value={examSecurity.code}
                  onChange={(e) =>
                    setExamSecurity({ ...examSecurity, code: e.target.value })
                  }
                />
              </div>
              
              <div className="modal-field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={examSecurity.password}
                  onChange={(e) =>
                    setExamSecurity({ ...examSecurity, password: e.target.value })
                  }
                />
              </div>

              <div className="modal-buttons">
                <button className="modal-btn cancel-btn" onClick={() => {
                  setShowModal(false);
                  setError("");
                }}>
                  Cancel
                </button>
                <button className="modal-btn confirm-btn" onClick={handleSubmit} disabled={submit}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SetExam;