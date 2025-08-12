import { useEffect, useState, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useParams } from "react-router-dom";
import "./ExamAnalysis.css";
import axiosInstance from "../../../../api/axiosInstance";
import { handleDownloadPDF } from "../../../../utils/pdfUtils";

const ExamAnalysis = () => {
  const { examId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [examInfo, setExamInfo] = useState(null);
  const [submissions, setSubmissions] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    axiosInstance
      .get(`/professor/getAnalysis/${examId}`, { withCredentials: true })
      .then((res) => {
        if (!res.data.analysis.submissions) {
          setSubmissions(false);
          return;
        } else {
          setSubmissions(true);
        }

        setAnalysis(res.data.analysis);
        setExamInfo(res.data.exam);
      })
      .catch(() => alert("Failed to load analysis."));
  }, [examId]);

  const convertToArrayAndSort = (freqMap) => {
    const dataArray = [];
    for (let score in freqMap) {
      dataArray.push({
        score: parseInt(score),
        count: freqMap[score],
      });
    }
    dataArray.sort((a, b) => a.score - b.score);
    return dataArray;
  };

  const generateScoreFrequencies = () => {
    if (!analysis) return [];
    const scores = analysis.results.map((r) => r.score);
    const freqMap = {};
    scores.forEach((score) => {
      freqMap[score] = (freqMap[score] || 0) + 1;
    });
    return convertToArrayAndSort(freqMap);
  };

  return (
    <div ref={printRef} className="exam-analysis-container">
      {!submissions ? (
        <h3 className="exam-analysis-submissions">No Submissions yet!</h3>
      ) : (
        <>
          <div className="title-and-pdf-button">
            <h2 className="exam-analysis-title">
              {examInfo.title} - Analysis
            </h2>
            <button
              className="exam-analysis-download-pdf-btn"
              onClick={() =>
                handleDownloadPDF(printRef, `${examInfo.title} - Analysis`)
              }
            >
              Download pdf
            </button>
          </div>

        <div className="exam-analysis-stats-text">
          <p>Average: <span>{analysis.mean}</span></p>
          <p>Median: <span>{analysis.median}</span></p>
          <p>Total Submissions: <span>{analysis.submissions}</span></p>
          <p>Exam Code: <span>{examInfo.code}</span></p>
          <p>Highest Score: <span>{analysis.results[0].score}</span></p>
          <p>Total Marks: <span>{examInfo.totalMarks}</span></p>
        </div>
         <div className="chart">
          <h3 className="exam-analysis-chart-title">Marks Distribution</h3>
          <ResponsiveContainer width="100%" height={350} c>
            <BarChart
              data={generateScoreFrequencies()}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="score"
                label={{
                  value: "Marks",
                  position: "insideBottom",
                  offset: -5,
                }}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, "auto"]}
                tickCount={8}
                label={{
                  value: "Count",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip />
              <Bar
                dataKey="count"
                fill="#509f06"
                barSize={40}
                isAnimationActive={true}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

          <h3 className="exam-analysis-table-title">Student Results</h3>
          <table className="exam-analysis-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Email</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {analysis.results.map((r, i) => (
                <tr key={i}>
                  <td>{r.rank}</td>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                  <td>{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default ExamAnalysis;
