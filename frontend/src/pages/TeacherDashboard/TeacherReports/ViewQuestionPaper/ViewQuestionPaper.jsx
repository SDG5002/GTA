import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./ViewQuestionPaper.css";
import axiosInstance from "../../../../api/axiosInstance";
import { handleDownloadPDF } from "../../../../utils/pdfUtils";
import { useRef } from "react";
import toast from "react-hot-toast";
const ViewQuestionPaper = () => {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const printRef=useRef();

  useEffect(() => {
    axiosInstance
      .get(`/professor/getExam/${examId}`, { withCredentials: true })
      .then((res) => setExam(res.data.exam))
      .catch(() => toast.error("Failed to load exam."));
  }, [examId]);

  if (!exam) return <div className="container"><p>Loading question paper...</p></div>;

  const totalMarks = exam.questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  return (
    <div ref={printRef} className="container">
      <div className="viewQpaper-title-and-downloadPdf">
         <h1 className="exam-title">{exam.title}</h1>
         <button className="download-pdf-button-viewQpaper" onClick={() => handleDownloadPDF(printRef,`${ exam.title}-analysis`)}>Download PDF</button>
      </div>
     
      <p className="exam-line"><strong>Description:</strong> {exam.description}</p>
      <p className="exam-line"><strong>Code:</strong> {exam.code}</p>
      <p className="exam-line"><strong>Password:</strong> {exam.password}</p>
      <p className="exam-line"><strong>Total Marks:</strong> {totalMarks}</p>

      <div className="queslist">
        {exam.questions.map((q, index) => (
          <div key={index} className="ques-box">
            <div className="ques-text">Q.{index + 1} {q.question}</div>
            <div className="marks-line">
              Marks: <b>{q.marks}</b> | Negative: <b>{q.negativeMarks}</b> | Unattempted: <b>{q.unattemptedMarks}</b>
            </div>

            {q.type === "MCQ" ? (
              <div className="option-box">
                {q.options.map((opt, i) => (
                  <label key={i} className={`option-radio ${opt === q.correctAnswer ? "right-one" : ""}`}>
                    <input type="radio" checked={opt === q.correctAnswer} disabled />
                    {opt}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-ans">
                Correct Answer: <b>{q.correctAnswer}</b>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewQuestionPaper;
