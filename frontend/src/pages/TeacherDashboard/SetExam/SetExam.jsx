import { useEffect, useState } from "react";
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
  const [aiData, setAiData] = useState(null);
  const [submit,setSubmit]=useState(false);
  const navigate = useNavigate();

  const location=useLocation();
  

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
      
//files is not a single file — it’s a FileList (like an array).
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
        //FormData only stores string or file values — it can’t store JS objects directly.So we use json.stringify later on backend it will be parsed as the json.parse()
        //Normal JSON can only handle text — no actual binary file data.
        //FormData is designed for multipart/form-data requests, which lets you send both
        //JSON-like fields and actual files in one go (exactly how HTML file uploads work).//HEnce we used the FormData object
        // Append each question’s data & file
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
        <h2>Create New Exam</h2>

        <form className="exam-form">
          <label>Exam Title</label>
          <input
            type="text"
            placeholder="Exam Title"
            value={examInfo.title}
            onChange={(e) =>
              setExamInfo({ ...examInfo, title: e.target.value })
            }
            required
          />

          <label>Description</label>
          <textarea
            placeholder="Description"
            value={examInfo.description}
            onChange={(e) =>
              setExamInfo({ ...examInfo, description: e.target.value })
            }
            required
          />
         <div className="time-info">
           <div className="time-info-box">
              <label>Scheduled At</label>
              <input
                type="datetime-local"
                value={examInfo.scheduledAt}
                onChange={(e) =>
                  setExamInfo({ ...examInfo, scheduledAt: e.target.value })
                }
              />
          </div>

          <div className="time-info-box">

            <label>Close At</label>
            <input
              type="datetime-local"
              value={examInfo.closeAt}
              onChange={(e) =>
                setExamInfo({ ...examInfo, closeAt: e.target.value })
              }
            />
          </div>

          <div className="time-info-box">

            <label>Duration (in minutes)</label>
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

          <h3 >Questions</h3>
          {questions.map((q, index) => (
            <div key={index} className="question-block">
             <div className="question-no-and-delete">
              <label>Question {index + 1}</label>
              {questions.length > 1 && <RxCross2 className="remove-question" onClick={() => handleRemoveQuestion(index)} />}
             </div>
              <textarea
                placeholder="Enter your question"
                value={q.question}
                onChange={(e) =>
                  handleQuestionChange(index, "question", e.target.value)
                }
                required
              />
            
           <input
              type="file"
              class='q-image-input'
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


              <div className="question-type">
                <label>Type</label>
                <select
                  value={q.type}
                  onChange={(e) =>
                    handleQuestionChange(index, "type", e.target.value)
                  }
                >
                  <option value="MCQ">MCQ</option>
                  <option value="NAT">Numerical</option>
                </select>
              </div>

              <div className="marking-scheme">
                <div className="mark-box green">
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
                <div className="mark-box red">
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
                <div className="mark-box gray">
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

              {q.type === "MCQ" && (
                <div className="options-section">
                  {q.options.map((opt, i) => (
                    <div key={i}>
                      <label>Option {i + 1}</label>
                      <input
                        type="text"
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) =>
                          handleOptionChange(index, i, e.target.value)
                        }
                        required
                      />
                    </div>
                  ))}
                 <div className="options-add-remove-btn">
                
                  <div className="remove-option-and-add-option">
                    <button
                      type="button"
                      className="small-btn"
                      onClick={() => addOption(index)}
                      disabled={q.options.length >= 5}
                    >
                      + Add Option
                    </button>

                    <button
                      type="button"
                      className="small-btn"
                      onClick={() => removeOption(index)}
                      disabled={q.options.length <= 2}
                    >
                      - Remove Option
                    </button>
                  </div>
               
              </div>


                  <div className="correct-ans-label">
                    <label>Correct Answer</label>
                  </div>

                  <select
                    value={q.correctAnswer}
                    required
                    onChange={(e) =>
                      handleQuestionChange(index, "correctAnswer", e.target.value)
                    }
                  >
                    <option value="">Select Correct Option</option>
                    {q.options.map((opt, i) => (
                      <option key={i} value={opt}>
                        Option {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {q.type === "NAT" && (
                <div>
                  <label>Correct Answer</label>
                  <input
                    type="number" 
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

            </div>
          ))}

          <div className="form-buttons">
            <button type="button" className="add-q-btn" onClick={addQuestion}>
              + Add Question
            </button>
            <button
              type="button"
              className="submit-btn"
              onClick={() => setShowModal(true)}
              disabled={submit}

            >
              Submit Exam
            </button>
          </div>
        </form>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Set Exam Code & Password</h3>

              {error && <p style={{ color: "red" }}>{error}</p>}

              <label>Exam Code</label>
              <input
                type="text"
                value={examSecurity.code}
                onChange={(e) =>
                  setExamSecurity({ ...examSecurity, code: e.target.value })
                }
              />
              <label>Password</label>
              <input
                type="password"
                value={examSecurity.password}
                onChange={(e) =>
                  setExamSecurity({ ...examSecurity, password: e.target.value })
                }
              />

              <div className="modal-buttons">
                <button className="small-btn" onClick={handleSubmit} disabled={submit}>
                  Confirm
                </button>
                <button
                  className="small-btn"
                  onClick={() => {
                    setShowModal(false);
                    setError("");
                  }}
                >
                  Cancel
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
