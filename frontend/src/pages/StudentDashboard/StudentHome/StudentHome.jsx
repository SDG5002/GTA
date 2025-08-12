import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "../../../components/Calender";
import 'react-calendar/dist/Calendar.css';
import "./StudentHome.css";
import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import axiosInstance from "../../../api/axiosInstance";
import { SlCalender } from "react-icons/sl";
import toast from "react-hot-toast";

function StudentHome() {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [code, setCode] = useState("");
  const [password, setPassword] = useState(""); 
  const {user}=useContext(AuthContext);
  const [error,setError]=useState('');
  const [quickReportsForHome, setQuickReportsForHome] = useState({
    totalSubmissions: 0,
    topThreeArray: [],
    recentActivities: [],
  });

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);


   useEffect(() => {
    axiosInstance
      .get("/student/quickReportsForStudentHome", { withCredentials: true })
      .then((res) => {setQuickReportsForHome(res.data); })
      .catch((err) =>console.log(err));
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    axiosInstance.post('/student/joinExam', {
     examCode: code,
     examPassword: password
    }, { withCredentials: true })
    .then((res) => {
       const examId = res.data.exam.examId;
      navigate(`/student/ExamPage/${examId}`);

    })
    .catch((err) => {
      if(err.response.status===400){setError(err.response.data.error); }
      else if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error); 
      } else {
        toast.error("An error occurred");
      }
    });

    
  };

  return (
    <div className="student-home">
      <div className="row">
        <div className="card-student profile">
          <div className="header">
            <div className="professor-avatar">{"\uD83D\uDC68\u200D\uD83C\uDFEB"}</div>
            <div className="details">
              <h2>Welcome,{user.name} {"\uD83D\uDC4B"}</h2>
              <p>Email ID: {user.email}</p>
            </div>
          </div>
        </div>

       
        <div className="card-student time-card">
          <div className="time-box">
            <h4>Join Exam</h4>
           
            <p >{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="exam-join-box">
        
            <form onSubmit={handleSubmit} className="exam-join-form-student">
              {error && <div className="exam-join-err">{error}</div>}
              <input type="text" placeholder="Enter Exam Code" value={code} onChange={(e) => setCode(e.target.value)} required />
              <input type="text" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="submit" className="btn student-exam-join">Join</button>
        
            </form>
          </div>
        </div>
      </div>

    
      <div className="row down-row-student">
        <div className="left-column">
          <div className="card-student activities">
            <h4><SlCalender style={{ color: "blue" }} /> Recent Activities</h4>
            <ul>
              {quickReportsForHome.recentActivities.length==0?<p>Not yet here</p>:
              quickReportsForHome.recentActivities.map((activity, index) => (
                <li key={index}>{activity.message}</li>
              ))}
            </ul>
          </div>

          <div className="stats-student">
            <div className="card-student student-marks">
              
              <table className="marks-table">
                <thead>
                  <tr>
                    <th>Past Tests</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                 { quickReportsForHome.topThreeArray.map((item, index) => (
                    <tr key={index}>
                      <td>{item.title}</td>
                      <td>{item.score}/{item.totalMarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card-student total-submissions-student">
              <h4>Total Submissions</h4>
              <p>{quickReportsForHome.totalSubmissions}</p>
            </div>
          </div>
        </div>

        <div className="card-student calendar">
          <Calendar />
        </div>
      </div>
    </div>
  );
}

export default StudentHome;
