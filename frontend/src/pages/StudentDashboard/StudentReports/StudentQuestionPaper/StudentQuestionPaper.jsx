import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./StudentQuestionPaper.css";
import axiosInstance from "../../../../api/axiosInstance";
import toast from "react-hot-toast";

const StudentQuestionPaper = () => {
  const { examId } = useParams();

  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);

    axiosInstance
      .get(`/student/getResponse/${examId}`, {
        withCredentials: true,
      })
      .then((res) => {
        setResponse(res.data.responses || null);
      })
      .catch((err) => {
        console.log(err);
        setError("Failed to load exam response.");
        toast.error("Failed to load exam response.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [examId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (
    !response ||
    !response.exam ||
    !Array.isArray(response.exam.questions)
  ) {
    return <div>No response found.</div>;
  }

  const { exam, answers, score, date } = response;

  return (
    <div className="student-question-paper-container">
      <h1 className="student-question-paper-title">{exam.title}</h1>

      <p className="student-question-paper-line">
        <strong>Description:</strong> {exam.description}
      </p>

      <p className="student-question-paper-line attempted">
        <strong>Attempted At:</strong>{" "}
        {new Date(date).toLocaleString("en-IN")}
      </p>

      <p className="student-question-paper-line score">
        <strong>Score:</strong> {score}/{exam.totalMarks}
      </p>

      <div className="student-question-paper-list">
        {exam.questions.map((q, index) => {
          const matchedAnswer = answers.find(
            (a) => a.questionId === q._id
          );

          const userAnswer = matchedAnswer?.selectedAnswer;

          let status = "wronge";

          if (userAnswer === q.correctAnswer) {
            status = "right";
          } else if (userAnswer === "unattempted") {
            status = "unattempted";
          }

          return (
            <div key={q._id} className="student-question-paper-box">
              <div className="student-question-paper-question">
                Q.{index + 1} {q.question}
              </div>

              <div className="student-question-paper-marks">
                Marks: <b>{q.marks}</b> | Negative:{" "}
                <b>{q.negativeMarks}</b> | Unattempted:{" "}
                <b>{q.unattemptedMarks}</b>

                {q.isDropped && (
                  <span className="dropped-q-student">
                    {" "}
                    ( Dropped )
                  </span>
                )}

                {q.isBonus && (
                  <span className="dropped-q-student">
                    {" "}
                    ( Bonus )
                  </span>
                )}
              </div>

              {q.imageUrl && (
                <img
                  src={q.imageUrl}
                  alt="Question"
                  className="student-view-question-image"
                />
              )}

              {q.type === "MCQ" ? (
                <div className="student-question-paper-options">
                  {q.options.map((opt, i) => (
                    <label
                      key={i}
                      className={`student-question-paper-option
                        ${opt === q.correctAnswer ? "right" : ""}
                        ${
                          opt === userAnswer &&
                          opt !== q.correctAnswer
                            ? "wronge"
                            : ""
                        }
                      `}
                    >
                      <input
                        type="radio"
                        checked={userAnswer === opt}
                        disabled
                        readOnly
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="student-question-paper-text-answer">
                  Correct Answer: <b>{q.correctAnswer}</b>
                </p>
              )}

              <div
                className={`student-question-paper-your-answer ${status}`}
              >
                <div className="yourAns">
                  Your Answer:{" "}
                  <b>
                    {userAnswer !== null &&
                    userAnswer !== undefined
                      ? userAnswer
                      : "Not Attempted"}
                  </b>
                </div>

                <div className="added-marks">
                  {status === "right" && (
                    <span>{q.marks}</span>
                  )}

                  {status === "wronge" && (
                    <span>{q.negativeMarks}</span>
                  )}

                  {status === "unattempted" && (
                    <span>{q.unattemptedMarks}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentQuestionPaper;