import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "./ExamPage.css";
import { FaClipboardList } from "react-icons/fa";

import axiosInstance from "../../../api/axiosInstance.js";
import { toast } from "react-hot-toast";

import { RxCrossCircled } from "react-icons/rx";



const ExamPage = () => {
  const { examId } = useParams();
  const [started, setStarted] = useState(false);
  const [exam, setExam] = useState(null);
  const [error, setError] = useState("");
  const [responses, setResponses] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [remainingTime, setRemainingTime] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [lateJoin, setLateJoin] = useState(false);
  const switchCount = useRef(0);
  const [submitted, setSubmitted] = useState(false);
  const [subModal, setSubModal] = useState(false);
  const [ruleModal, setRuleModal] = useState(false);

  const navigate = useNavigate();

  const autoSubmitRef = useRef();
  useEffect(() => {
    autoSubmitRef.current = autoSubmitExam;
  });

  useEffect(() => {
    if (!started) return;

    const handleViolation = () => {
      if (!started) return;
      switchCount.current += 1;

      if (switchCount.current === 1) {
        toast.error("Please do not switch tabs. This is your first warning.");
      } else if (switchCount.current === 2) {
        toast.error("Final warning: Do not leave the exam tab!");
      } else if (switchCount.current === 3) {
        autoSubmitRef.current(true);
        toast.error("Exam ended due to repeated tab switching.");
      }
    };

    const handleBlur = () => {
      console.warn("Tab switched or minimized!");
      handleViolation();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") handleViolation();
    };

    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);


    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "If you leave, your exam will be submitted automatically.";
    };

    const handlePopState = () => {
      const confirmLeave = window.confirm(
        "If you go back, your exam will be submitted automatically. Are you sure?"
      );
      if (confirmLeave) {
        autoSubmitRef.current();
        window.history.go(-1);
      } else {
        window.history.pushState(null, "", window.location.href);
      }
    };


    window.addEventListener("beforeunload", handleBeforeUnload);


    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    const preventAction = (e) => {
      e.preventDefault();
      toast.error("Copying, cutting, or pasting is disabled during the exam!");
    };

    const preventContextMenu = (e) => {
      e.preventDefault();
    };

    document.addEventListener("copy", preventAction);
    document.addEventListener("cut", preventAction);
    document.addEventListener("paste", preventAction);
    document.addEventListener("contextmenu", preventContextMenu);

    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("copy", preventAction);
      document.removeEventListener("cut", preventAction);
      document.removeEventListener("paste", preventAction);
      document.removeEventListener("contextmenu", preventContextMenu);
      switchCount.current = 0;
    };
  }, [started]);






  useEffect(() => {
    axiosInstance
      .get(`/student/startExamInfo/${examId}`, { withCredentials: true })
      .then((res) => {
        const info = res.data.exam;

        setExam({
          title: info.title || "Exam Title",
          description: info.description || "No description",
          examId,
          closeAt: info.closeAt,
          duration: info.duration,
          questions: []
        });

        if (res.data.alreadyStarted) {
          axiosInstance
            .get(`/student/startExam/${examId}`, { withCredentials: true })
            .then((startRes) => {
              const startInfo = startRes.data.exam;
              const questions = startInfo.questions || [];

              setExam((prev) => ({
                ...prev,
                questions,
                duration: startInfo.duration,
                closeAt: startInfo.closeAt,
              }));

              if (startRes.data.submitted) {
                if (startRes.data.autoSubmitted) {
                  toast.error("Exam was automatically submitted due to reload violation.");
                }
                navigate("/student/thankyou");
                return;
              }

              if (startRes.data.reloadCount === 1) {
                toast.error("Reload Warning 1: Please do not reload the page.");
              } else if (startRes.data.reloadCount === 2) {
                toast.error("Reload Warning 2: Final Warning! Reloading again will automatically submit your exam.");
              }

              setResponses(startRes.data.savedResponses || {});

              const examTimeLeft = Math.max(0, Math.floor((startRes.data.endTime - startRes.data.currentTime) / 1000));
              setRemainingTime(examTimeLeft);
              setStartedAt(startRes.data.startedTime);
              setStarted(true);
            })
            .catch((err) => {
              console.error("Error restoring exam:", err);
            });
        }
      })
      .catch((err) => {
        if (err.response?.data?.message?.includes("already submitted")) {
          navigate("/student/thankyou");
        } else {
          console.log(err);
          toast.error("Server Error");
        }
      });
  }, [examId, navigate]);

  const handleStart = () => {
    axiosInstance
      .get(`/student/startExam/${examId}`, { withCredentials: true })
      .then((res) => {
        const info = res.data.exam;
        const questions = info.questions || [];

        setExam((prev) => ({
          ...prev,
          questions,
          duration: info.duration,
          closeAt: info.closeAt,
        }));

        if (res.data.submitted) {
          if (res.data.autoSubmitted) {
            toast.error("Exam was automatically submitted due to reload violation.");
          }
          navigate("/student/thankyou");
          return;
        }

        if (res.data.reloadCount === 1) {
          toast.error("Reload Warning #1: Please do not reload the page.");
        } else if (res.data.reloadCount === 2) {
          toast.error("Reload Warning #2: Final Warning! Reloading again will automatically submit your exam.");
        }

        setResponses(res.data.savedResponses || {});

        const examTimeLeft = Math.max(0, Math.floor((res.data.endTime - res.data.currentTime) / 1000));
        setRemainingTime(examTimeLeft);
        setStartedAt(res.data.startedTime);
        setStarted(true);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Error starting exam.");
      });
  };

  useEffect(() => {
    if (!started) return;
    if (remainingTime === null) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          autoSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started]);

  const handleChange = (value) => {
    const qId = exam.questions[currentQ]._id;

    
    setResponses((prev) => {
      const updated = {
        ...prev,
        [qId]: value,
      };

      const formattedResponses = exam.questions.map((q) => ({
        questionId: q._id,
        selectedAnswer: q._id === qId ? value : (prev[q._id] || "unattempted"),
      }));

      axiosInstance
        .post("/student/saveResponses", { examId, responses: formattedResponses  })
        .catch((err) => {
          console.error("Error saving responses:", err);
        });

      return updated;
    });
  };

  const getFormattedResponses = () => {
    return exam.questions.map((q) => ({
      questionId: q._id,
      selectedAnswer: responses[q._id] || "unattempted",
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedResponses = getFormattedResponses();
    setStarted(false);
    setStartedAt(null);
    setSubmitted(true);
    setSubModal(false);
    navigate("/student/thankyou");
    axiosInstance
      .post(
        `/student/submitExam/${examId}`,
        { responses: formattedResponses },
        { withCredentials: true }
      )
      .then(() => {

        toast.success("Exam submitted!");
        setSubmitted(false);

      })
      .catch((err) => {
        console.log(err);
        toast.error("Error submitting exam.");
      });
  };

  const autoSubmitExam = (isTabSwitchViolation = false) => {
    const formattedResponses = getFormattedResponses();
    setStarted(false);
    setStartedAt(null);
    setSubmitted(true);
    axiosInstance
      .post(`/student/submitExam/${examId}`, { responses: formattedResponses, autoSubmitted: isTabSwitchViolation }, { withCredentials: true })
      .then(() => {
        setSubmitted(false)
        navigate("/student/thankyou");
        toast.success("Exam auto-submitted.");



      })
      .catch((err) => {
        console.log(err);
        toast.error("Error during auto-submit.");
      });
  };




  const nextQuestion = () => {
    if (currentQ < exam.questions.length - 1) setCurrentQ(currentQ + 1);
  };

  const prevQuestion = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  const progressPercent = exam?.questions?.length
    ? ((currentQ + 1) / exam.questions.length) * 100
    : 0;

  if (error) {
    return <div className="error-box">ERROR: {error}</div>;
  }

  return (
    <div className={"exam-wrapper" + (started ? "-started" : "")}>
      {ruleModal &&
        <div class="exam-rules-modal-overlay">
          <div class="exam-rules-modal">
            <div className="top-rules">
              <strong>Rules:</strong>
              <RxCrossCircled onClick={() => { setRuleModal(false) }} />
            </div>
            <ul>
              <li>Tab switching is not allowed. Repeated tab switches will lead to automatic submission of your exam.</li>
              <li>Copying questions, pasting answers, or right-clicking is strictly disabled.</li>
              <li>If your exam gets submitted accidentally, contact your professor immediately.</li>
            </ul>
          </div>
        </div>
      }
      {subModal &&
        <div className="exam-submit-modal-overlay">
          <div className="exam-submit-modal">
            Are you sure to submit exam?

            <div className="exam-submit-modal-btns">
              <button onClick={() => setSubModal(false)}>cancle</button>
              <button onClick={handleSubmit}>Submit</button>
            </div>
          </div>

        </div>}


      {(!started || !exam || !exam.questions || exam.questions.length === 0) && !submitted ? (
        <>
          <img src="/images/greenBoard.png" alt="Start Exam" />
          <div className="start-section">

            <h1>{exam?.title}</h1>
            <p>{exam?.description}</p>
            <p className="duration">Duration: {exam?.duration} minutes</p>
            {lateJoin && (
              <p className="late-join">
                You joined late. The exam will close automatically at the scheduled time.
              </p>
            )}
            <button className="start-btn" disabled={ruleModal} onClick={handleStart}>
              Start Exam
            </button>
            <p className="rules-title" onClick={() => setRuleModal(true)}> <FaClipboardList />Rules</p>




          </div>
        </>
      ) : (
        <div className="exam-start-container">

          <div className="top-bar">
            <div className="exam-info-and-time">
              <div className="exam-info-title">
                <h2>{exam?.title}</h2>
              </div>

              <div className="time-remaining">
                Time:{" "}
                <span className={`timer ${remainingTime < 60 ? "red" : "green"}`}>
                  {Math.floor(remainingTime / 60)} min{" "}
                  {(remainingTime % 60).toString().padStart(2, "0")} sec
                </span>
              </div>

            </div>

            <div className="progress-and-submit">
              <div className="progress-container">

                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>
              <div className="mark-buttons">
                <button className="mark-btn" type="button" onClick={() => setSubModal(true)}>
                  Submit
                </button>
              </div>
            </div>
          </div>



          <form className="question-form">
            <div className="question-box">
              <h3>Question {currentQ + 1}</h3>

              <div className="marks-info">
                <span>
                  Marks: <b>{exam.questions[currentQ].marks ?? "-"}</b>
                </span>
                <span> | </span>
                <span>
                  Unattempted: <b>{exam.questions[currentQ].unattemptedMarks ?? "-"}</b>
                </span>
                <span> | </span>
                <span>
                  Negative: <b>{exam.questions[currentQ].negativeMarks ?? "-"}</b>
                </span>
              </div>

              <p className="question-text">{exam.questions[currentQ].question}</p>

              {exam.questions[currentQ]?.imageUrl &&
                <div >
                  <img className="q-image" src={exam.questions[currentQ]?.imageUrl} alt="Question Image" />

                </div>}

              <hr />


              {exam.questions[currentQ].type === "MCQ" ? (
                <>
                  <div className="options">
                    {exam.questions[currentQ].options.map((opt, i) => {
                      const qId = exam.questions[currentQ]._id;
                      return (
                        <label
                          key={i}
                          className={`option-label ${responses[qId] === opt ? "selected" : ""
                            }`}
                        >
                          <input
                            type="radio"
                            name={`question-${qId}`}
                            value={opt}
                            checked={responses[qId] === opt}
                            onChange={() => handleChange(opt)}
                          />
                          <p>{opt}</p>

                        </label>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="clear-btn"
                    onClick={() => handleChange("unattempted")}
                  >
                    Clear Answer
                  </button>
                </>
              ) : (
                <input
                  type="number"
                  className="nat-input"
                  placeholder="Enter your answer"
                  value={
                    responses[exam.questions[currentQ]._id] === "unattempted"
                      ? ""
                      : responses[exam.questions[currentQ]._id]
                  }
                  onChange={(e) =>
                    handleChange(e.target.value || "unattempted")
                  }
                />
              )}
            </div>

            <div className="navigation-buttons">
              <div className="nav-buttons-inner">
                <button
                  type="button"
                  className="nav-btn"
                  onClick={prevQuestion}
                  disabled={currentQ === 0}
                >
                  ← Previous
                </button>
                {currentQ === exam.questions.length - 1 ? (
                  <button type="button" className="submit-btn" onClick={() => setSubModal(true)}>
                    Finish
                  </button>
                ) : (
                  <button type="button" className="nav-btn" onClick={nextQuestion}>
                    Next →
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ExamPage;