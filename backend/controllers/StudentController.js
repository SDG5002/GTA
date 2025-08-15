import wrapAsync from "../utils/wrapAsync.js";
import ExpressError from "../utils/ExpressError.js";
import User from "../DB/models/userModel.js";
import Exam from "../DB/models/ExamModel.js";
import ExamResponses from "../DB/models/ExamResponses.js";
import { sendMarksEmail } from "../utils/marksMailer.js";


const DATE_FORMAT_OPTIONS = {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true
};


export const joinExam = wrapAsync(async (req, res, next) => {
  const { examCode, examPassword } = req.body;
  const { _id } = req.user;

  const user = await User.findById(_id);
  if (!user) return next(new ExpressError(404, "User not found"));
  if (user.role !== "student")
    return next(new ExpressError(403, "Only students can join exams"));

  const exam = await Exam.findOne({ code: examCode, password: examPassword })
  if (!exam) return next(new ExpressError(404, "Invalid exam code or password"))

  const response = await ExamResponses.findOne({ exam: exam._id, student: _id });
  if(response?.status === "submitted") return next(new ExpressError(400, "User had Alredy Submitted this Exam"));

  if(exam.closeAt < Date.now()) return next(new ExpressError(400, "Exam is closed"))
  if(exam.scheduledAt > Date.now()) return next(new ExpressError(400, "This Exam is scheduled to start at " + new Date(exam.scheduledAt).toLocaleString('en-IN', DATE_FORMAT_OPTIONS)))
 
 

  res.status(200).json({
    message: "User joined the exam successfully",
    exam: {
      examId: exam._id,
    },
  });
});


export const startExamInfo = wrapAsync(async (req, res, next) => {
  const { examId } = req.params;
  const { _id } = req.user;

  const user = await User.findById(_id);
  if (!user) return next(new ExpressError(404, "User not found"));
  if (user.role !== "student")
    return next(new ExpressError(403, "Only students can start exams"));

  const exam = await Exam.findById(examId);
  if (!exam) return next(new ExpressError(404, "Invalid exam id"));

 
  let alResponse = await ExamResponses.findOne({ exam: examId, student: _id });
  if(alResponse?.status === "submitted"){ 
    return next(new ExpressError(400, "You have already submitted this exam"));}
  

  res.status(200).json({
    message: "Exam started successfully",
    exam: {
      title: exam.title,
      examId: exam._id,
      description: exam.description,
      totalMarks: exam.totalMarks,
      questions: exam.questions,
      duration: exam.duration,
      closeAt: exam.closeAt
    }
  });
  
})
export const startExam = wrapAsync(async (req, res, next) => {
  const { examId } = req.params;
  const { _id } = req.user;

  const user = await User.findById(_id);
  if (!user) return next(new ExpressError(404, "User not found"));
  if (user.role !== "student")
    return next(new ExpressError(403, "Only students can start exams"));

  const exam = await Exam.findById(examId);
  if (!exam) return next(new ExpressError(404, "Invalid exam id"));

 
  let alResponse = await ExamResponses.findOne({ exam: examId, student: _id });

  if(alResponse?.status === "submitted") return next(new ExpressError(400, "You have already submitted this exam"));
  
  let response=null
  
  if(!alResponse){
      response=new ExamResponses({
      exam: exam._id,
      student: user._id,
      answers: exam.questions.map(q => ({
        questionId: q._id,
        selectedAnswer: null
      })),
      startTime: Date.now()
    });
    await response.save();

    user.history.push({
      message: `You started the exam named: ${exam.title} at ${new Date().toLocaleString('en-IN', DATE_FORMAT_OPTIONS)}`,
      createdAt: new Date(),
    });
    await user.save({ validateBeforeSave: false });

  }


  res.status(200).json({
    message: "Exam started successfully",
    exam: {
      title: exam.title,
      startedTime: response ? response.startTime : alResponse.startTime,
      examId: exam._id,
      description: exam.description,
      totalMarks: exam.totalMarks,
      questions: exam.questions,
      duration: exam.duration,
      closeAt: exam.closeAt
    }
  });
});


export const submitExam = wrapAsync(async (req, res, next) => {
    const { examId } = req.params;
    const { _id } = req.user;

    const exam=await Exam.findById(examId);

    if(!exam) return next(new ExpressError(404, "Invalid exam id"));

    const user = await User.findById(_id);
    if (!user) return next(new ExpressError(404, "User not found"));

    if (user.role !== "student")
      return next(new ExpressError(403, "Only students can submit exams"));

    const response = await ExamResponses.findOne({
      exam: examId,
      student: _id,
    });

    if (!response)
      return next(new ExpressError(400, "User has not joined this exam."));

     const {responses}=req.body;
 
     
     if(Object.keys(responses).length!=exam.questions.length) return next(new ExpressError(400, "Invalid number of responses, Try to contact your professor."));

     const studentResponses = response;

     studentResponses.answers=responses;

     await studentResponses.save();

     user.responses.push(studentResponses._id);
     await user.save();

     //Marks Calculations
      let marks = 0;

      for (const { questionId, selectedAnswer } of responses) {
        const question = exam.questions.find((q) => q._id.toString() === questionId);

        if (!question) {
          return next(new ExpressError(400, `Invalid question ID: ${questionId}`));
        }

      if (selectedAnswer === question.correctAnswer) {
          marks += question.marks;
        } else if (!selectedAnswer || selectedAnswer === "unattempted") {
          marks += question.unattemptedMarks;
        } else {
          marks += question.negativeMarks;
        }

      }
    
   

    const examWithProf = await Exam.findById(examId).populate("professor", "name");
    const profName = examWithProf.professor.name;
  
    

    sendMarksEmail(exam.title,profName,user.email,user.name,marks,exam.totalMarks);

    studentResponses.score=marks;
    studentResponses.status="submitted";
    await studentResponses.save();

    user.history.push({
      message : "You have submitted exam named " + exam.title + " at " + new Date().toLocaleString('en-IN', DATE_FORMAT_OPTIONS),
      createdAt: new Date(),
     });

     await user.save({ validateBeforeSave: false });


     res.status(200).json({
       message: "Exam submitted successfully",
       exam: {
         title: exam.title,
         examId: exam._id,
         description: exam.description,
         totalMarks:exam.totalMarks,
         score:marks
       }
     });



})


export const getReports = wrapAsync(async (req, res, next) => {
  const { _id } = req.user;

  const user = await User.findById(_id).populate({
      path: "responses",
      populate: {
        path: "exam",
        select: "title totalMarks professor",
        populate: { path: "professor", select: "name" }
      }
    });

  if (!user) return next(new ExpressError(404, "User not found"));
  if (user.role !== "student") return next(new ExpressError(403, "Only student can get reports"));

  const data = user.responses
    .sort((a, b) => b.attemptedAt - a.attemptedAt)
    .map((r) => ({
      examId: r.exam._id,
      title: r.exam.title,
      professor: r.exam.professor?.name || "Unknown",
      date: r.startTime,
      score: r.score,
      totalMarks: r.exam.totalMarks,
    }));

  res.status(200).json({
    message: "Reports sent successfully",
    data,
  });
});


export const getResponses = wrapAsync(async (req, res, next) => {
  const { examId } = req.params;
  const { _id } = req.user;

  const user = await User.findById(_id).populate({
    path: "responses",
    match: { exam: examId },
    populate: {
      path: "exam",
      select: "title totalMarks professor questions description startTime",
    }
  });

  if (!user) return next(new ExpressError(404, "User not found"));
  if (user.role !== "student") return next(new ExpressError(403, "Only student can get responses"));

  const response = user.responses[0]; // matched response as it is only one

  if (!response) return next(new ExpressError(404, "Responses not found"));

  res.status(200).json({
    responses: {
      exam: response.exam,
      answers: response.answers,
      score: response.score,
      date: response.startTime
    }
  });
});


export const quickReportsForStudentHome = wrapAsync(async (req, res, next) => {
  const { _id } = req.user;
  const user = await User.findById(_id).populate({
      path: "responses",
      populate: {
        path: "exam",
        select: "title totalMarks",
      },
    });


  if (!user) return next(new ExpressError(404, "User not found"));
  if (user.role !== "student")
    return next(new ExpressError(403, "Only student can get these quick reports"));

  const totalSubmissions = user.responses.length;


  
  const topThreeResponses = user.responses.sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  console.log(topThreeResponses)
  
  const topThreeArray = topThreeResponses.map((r) => ({
    title: r.exam?.title || "Unknown",
    score: r.score,
    totalMarks: r.exam?.totalMarks || 0,
  }));

  const recentActivities = user.history.sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);

  res.status(200).json({
    totalSubmissions,
    topThreeArray,
    recentActivities,
  });
});
