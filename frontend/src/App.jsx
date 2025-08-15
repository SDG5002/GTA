import { Routes, Route } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage/WelcomePage.jsx';
import LoginPage from './pages/LoginAndRegisterPages/LoginPage.jsx';
import RegisterPage from './pages/LoginAndRegisterPages/RegisterPage.jsx';
import Unauthorized from './pages/UnauthorizedPage/Unauthorized.jsx';
import Home from './pages/TeacherDashboard/Home/Home';
import SetExam from './pages/TeacherDashboard/SetExam/SetExam.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import './App.css';
import TeacherLayout from './pages/TeacherDashboard/TeacherLayout';
import StudentHome from './pages/StudentDashboard/StudentHome/StudentHome.jsx';
import StudentLayout from './pages/StudentDashboard/StudentLayout.jsx';
import ExamPage from './pages/StudentDashboard/ExamPage/ExamPage.jsx';


import ThankYouPage from './pages/StudentDashboard/ThankYouPage/ThankYouPage.jsx';
import TeacherReports from './pages/TeacherDashboard/TeacherReports/TeacherReports/TeacherReports.jsx';
import ViewQuestionPaper from './pages/TeacherDashboard/TeacherReports/ViewQuestionPaper/ViewQuestionPaper.jsx';
import ExamAnalysis from './pages/TeacherDashboard/TeacherReports/ExamAnalysis/ExamAnalysis.jsx';
import MyAccountPage from './pages/MyAccountPage/MyAccountPage.jsx';
import StudentReports from './pages/StudentDashboard/StudentReports/StudentReportsLanding/StudentReports.jsx';
import StudentQuestionPaper from './pages/StudentDashboard/StudentReports/StudentQuestionPaper/StudentQuestionPaper.jsx';
import EditExam from './pages/TeacherDashboard/TeacherReports/EditExam/EditExam.jsx';
import ManageSessions from './pages/TeacherDashboard/TeacherReports/ManageSessions/ManageSessions.jsx';
import { Toaster } from 'react-hot-toast';




function App() {

  return (
    <>
   <Toaster
        position="top-right"
        toastOptions={{
          style: {
            zIndex: 99999, 
          },
        }}
      />

    

     <AuthProvider>
      <Routes>
       
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />}/>
        <Route path="/unauthorized" element={<Unauthorized />} />

       
        <Route
          path="/student-dashboard/*"
          element={
           
              <ProtectedRoute allowedRoles={["student"]}>
                
                    <StudentLayout />
                 
              </ProtectedRoute>

              
            
          }
          
        > 
          <Route path="" element={<StudentHome/>} />
          <Route path="reports" element={<StudentReports />} />
          <Route path="reports/responses/:examId" element={<StudentQuestionPaper />} />
          <Route path="account" element={<MyAccountPage />} />
        </Route>


        <Route
          path="/teacher-dashboard/*"
          element={
           
              <ProtectedRoute allowedRoles={["professor"]}>
                <TeacherLayout />
              </ProtectedRoute>  

          }
          
        >
          <Route path="" element={<Home />} />
          <Route path="set-exam" element={<SetExam />} />
          
          <Route path="reports" element={<TeacherReports />} />
          <Route path="reports/questionPaper/:examId" element={<ViewQuestionPaper />} />
          <Route path="reports/analysis/:examId" element={<ExamAnalysis />} />
          <Route path="reports/EditExam/:examId" element={<EditExam />} />
          <Route path="reports/ManageSessions/:examId" element={<ManageSessions />} />
          <Route path="account" element={<MyAccountPage />} />
          
        </Route>

          <Route
              path="/student/ExamPage/:examId"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <ExamPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/thankyou"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <ThankYouPage/>
                </ProtectedRoute>
              }
            />
         

         <Route 
           path="*"
           element={<h1 className='not-found-page'>404 Page not found</h1>}
         />

             </Routes>
      </AuthProvider>


</>
    
  );
}

export default App;
