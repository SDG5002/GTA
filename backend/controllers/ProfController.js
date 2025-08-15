import wrapAsync from "../utils/wrapAsync.js";
import ExpressError from "../utils/ExpressError.js";
import User from "../DB/models/userModel.js";
import Exam from "../DB/models/ExamModel.js";
import { sendMarksEmail } from "../utils/marksMailer.js";
import ExamResponses from "../DB/models/ExamResponses.js";
import gemini from "../utils/ai.js";
import {deleteFromCloudinary,uploadOnCloudinary} from "../utils/cloudinary.js";


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



export const uploadExam = wrapAsync(async (req, res, next) => {

  const { _id } = req.user;
  const user = await User.findById(_id);
  if (!user) return next(new ExpressError(404, "User not found"));
  if (user.role !== "professor") {
    return next(new ExpressError(403, "Only professors can upload exams"));
  }

    
  //as our forma data is mixed with files and text it cant be directly parsed by the outer middleware in app.js
  const examInfo = JSON.parse(req.body.examInfo);

  const code=examInfo.code;

  const isExistCode=await Exam.findOne({code:code});
  if(isExistCode){
    return next(new ExpressError(400, "Code already exists"));
  }
  const questions = [];

  // Parse questions
  for (let key in req.body) {
    if (key.startsWith("questions")) {
      const index = parseInt(key.replace("questions", ""));
      questions[index] = JSON.parse(req.body[key]);
    }
  }



  // Attach image URLs to corresponding questions
  if (req.files && req.files.length > 0) {
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const uploadResult = await uploadOnCloudinary(file.path);

      const index = parseInt(file.fieldname.replace("images", ""));
      console.log(index);
      if (questions[index]) {
        questions[index].imageUrl = uploadResult.secure_url;
        questions[index].imagePublicId = uploadResult.public_id;
      }
    }
  }

  


  const newExam = new Exam({
    ...examInfo,
    professor: _id,
    questions
  });

  await newExam.save();
  user.exams.push(newExam._id);


  const now = new Date();
  const istDateTime = new Intl.DateTimeFormat("en-IN", DATE_FORMAT_OPTIONS).format(now);

  user.history.push({
    message: `Exam named ${examInfo.title} with code: ${examInfo.code} and password: ${examInfo.password} was uploaded successfully at ${istDateTime}.`
  });

  await user.save({ validateBeforeSave: false });

  res.status(201).json({
    message: "Exam uploaded successfully",
    examId: newExam._id
  });
});

export const getExams = wrapAsync(async (req, res, next) => {
  const { _id } = req.user;

  const user = await User.findById(_id);

  if (!user) {
    return next(new ExpressError(404, "User not found"));
  }

  if (user.role !== "professor") {
    return next(new ExpressError(403, "Only professors can get exams"));
  }
   const exams = await Exam.find({ professor: _id });
  const examsSorted=exams.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

 
  res.status(200).json({
    message: "Exams fetched successfully",
    exams: examsSorted.map((examI) => ({
      title: examI.title,
      id: examI._id,
      code: examI.code,
      password: examI.password,
      description: examI.description,
      totalMarks: examI.totalMarks,
      createdAt: examI.createdAt,
      questions: examI.questions,
      duration: examI.duration,
      scheduledAt: examI.scheduledAt,
      closeAt: examI.closeAt
    })),
  });
});

export const getExam = wrapAsync(async (req, res, next) => {
      const { examId } = req.params;
      const exam = await Exam.findById(examId);

      if (!exam) return next(new ExpressError(404, "Invalid exam id"));
      res.status(200).json({ exam: exam });
});

export const getAnalysis = wrapAsync(async (req, res, next) => {
  const { examId } = req.params;

  const exam = await Exam.findById(examId);
  if (!exam) {
    return next(new ExpressError(404, "Exam not found"));
  }

  const responses = await ExamResponses.find({ exam: examId }).populate("student", "name email");

  const scores = responses.map((r) => r.score);
  const total = scores.length;

  let mean = 0;
  let median = 0;

  if (total > 0) {
    const sum = scores.reduce((a, b) => a + b, 0);
    mean = (sum / total).toFixed(2);

    const sortedScores = [...scores].sort((a, b) => a - b);
    median =
      total % 2 === 0
        ? ((sortedScores[total / 2 - 1] + sortedScores[total / 2]) / 2).toFixed(2)
        : sortedScores[Math.floor(total / 2)];
  }

  const sortedResponses = [...responses].sort((a, b) => b.score - a.score);
  const rankedResults = [];
  let currentRank = 1;
  let prevScore = null;

  for (let i = 0; i < sortedResponses.length; i++) {
    const r = sortedResponses[i];

    if (r.score !== prevScore) {
      currentRank = i + 1;
    }

    rankedResults.push({
      name: r.student.name,
      email: r.student.email,
      score: r.score,
      rank: currentRank
    });

    prevScore = r.score;
  }

  res.status(200).json({
    exam: {
      title: exam.title,
      code: exam.code,
      totalMarks: exam.totalMarks,
    },
    analysis: {
      mean,
      median,
      submissions: total,
      results: rankedResults,
    },
  });
});

export const getStats = wrapAsync(async (req, res, next) => {
      const userId = req.user._id;
      const user = await User.findById(userId);

      if (!user) return next(new ExpressError(404, "User not found"));
      if (user.role !== "professor") return next(new ExpressError(403, "Only professors can get stats"));

      if (!user.exams || user.exams.length === 0) {
        return res.status(200).json({
          totalExams: 0,
          totalSubmissions: 0,
          emailId: user.email,
          latestExam: null,
          recentActivities: user.history
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3)
        });
      }

      let totalExams = user.exams.length;
      
      const latestExam = await Exam.findOne({ professor: userId }).sort({ createdAt: -1 });//-1 for newest one

 
      const totalSubmissions = await ExamResponses.countDocuments({
          exam: { $in: user.exams }
        });



      

      const istTime = new Intl.DateTimeFormat('en-IN', DATE_FORMAT_OPTIONS).format(new Date(latestExam.createdAt));

      res.status(200).json({
        totalExams,
        totalSubmissions,
        latestExam: {
          title: latestExam.title,
          code: latestExam.code,
          password: latestExam.password,
          createdAt: istTime
        },
        recentActivities: user.history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                      .slice(0, 3),
        emailId: user.email
         
      });
    });

export const deleteExam = wrapAsync(async (req, res, next) => {
  const { examId } = req.params;
  if (!examId) return next(new ExpressError(400, "Exam ID is missing"));
  console.log(req.params)

  const { _id } = req.user;

  const user = await User.findById(_id);
  if (!user) return next(new ExpressError(404, "User not found"));

  if (user.role !== "professor")
    return next(new ExpressError(403, "Only professors can delete exams"));

  const exam = await Exam.findById(examId);
  if (!exam) return next(new ExpressError(404, "Exam not found"));

  
  const responseIds = await ExamResponses.find({ exam: examId }).distinct("_id");//distinct to get only unique ids
  await ExamResponses.deleteMany({ exam: examId });

  
  await User.updateMany(
    {
      $or: [
        { exams: examId },
        { responses: { $in: responseIds } }
      ]
    },
    {
      $pull: {
        exams: examId,
        responses: { $in: responseIds }
      }
    }
  );

  console.log(exam)

  //cloudinary delete
  for (let i = 0; i < exam.questions.length; i++) {
    if(exam.questions[i].imagePublicId){
      await deleteFromCloudinary(exam.questions[i].imagePublicId);

    }
    
  }



  
  await Exam.findByIdAndDelete(examId);

 
  user.history.push({
    message: `You deleted the exam named: ${exam.title} at ${new Date().toLocaleString("en-IN", DATE_FORMAT_OPTIONS)}`,
    createdAt: new Date(),
  });

  await user.save({ validateBeforeSave: false });

  res.status(200).json({ message: "Exam and associated responses deleted successfully" });
});


export const reReleaseResults = wrapAsync(async (req, res, next) => {
  const { examId } = req.params;
  

  const questions=req.body.exam.questions;
  

  if (!examId) return next(new ExpressError(400, "Exam ID is missing"));

  const user = await User.findById(req.user._id);
  if (!user || user.role !== "professor")
    return next(new ExpressError(403, "Access denied"));

  const exam = await Exam.findById(examId);
  if (!exam) return next(new ExpressError(404, "Exam not found"));

  
  if (questions && Array.isArray(questions)) {
    exam.questions = questions;
  }

  
  exam.totalMarks = questions.reduce((total, question) => {
    if(question.isDropped){
      return total;
    }
    return total + question.marks;
  },0);


  await exam.save();

  const responses = await ExamResponses.find({ exam: exam._id });
  
  

  for (const response of responses) {
     let marks = 0;
     const student_id=response.student;
     const student=await User.findById(student_id);

      for (const { questionId, selectedAnswer } of (await response.populate("answers")).answers) {
        const question = exam.questions.find((q) => q._id.toString() === questionId);

        if (!question) {
          return next(new ExpressError(400, `Invalid question ID: ${questionId}`));
        }

        if(question.isBonus){
          marks+=question.marks;
          continue;
        }

        if(question.isDropped){
          continue;
        }

        if (selectedAnswer === question.correctAnswer) {
          marks += question.marks;
        } else if (selectedAnswer === "unattempted") {
          marks += question.unattemptedMarks;
        } else {
          marks += question.negativeMarks;
        }


      }

      response.score = marks;
      await response.save();
      
      sendMarksEmail(
        exam.title,
        user.name,
        student.email,
        student.name,
        marks,
        exam.totalMarks,
        true
      );

      student.history.push({
        message: `Your Professor Re-released the results for the exam: ${exam.title} at ${new Date().toLocaleString("en-IN", DATE_FORMAT_OPTIONS)}`,
        createdAt: new Date(),
      })
   
      student.save({ validateBeforeSave: false });

  }

  
  user.history.push({
    message: `You re-released the results for the exam: ${exam.title} at ${new Date().toLocaleString("en-IN", DATE_FORMAT_OPTIONS)}`,
    createdAt: new Date(),
  });
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    message: "Exam results re-released. Student responses reset as needed.",
    updatedResponses: responses.length,
    updatedQuestions: exam.questions.length,
    examId: exam._id
  });
});

export const manageSessions = wrapAsync(async (req, res, next) => {
  const { examId } = req.params;

  if (!examId) return next(new ExpressError(400, "Exam ID is missing"));

  const user = await User.findById(req.user._id);
  if (!user || user.role !== "professor") {
    return next(new ExpressError(403, "Only professors can manage sessions"));
  }


  const exam = await Exam.findById(examId);
  if (!exam) return next(new ExpressError(404, "Exam not found"));
  if (!exam.professor.equals(user._id)) {
    return next(new ExpressError(403, "Access denied: Not your exam"));
  }

  
  const sessions = await ExamResponses.find({ exam: examId })
    .populate("student", "name email")//only from student populate name and email
    .select("status student");

  const sessionData = sessions.map((session) => ({
    studentName: session.student.name,
    studentEmail: session.student.email,
    status: session.status,
  }));

  res.status(200).json({
    message: "Sessions fetched successfully",
     examTitle: exam.title,
    sessions: sessionData,
  });
});

export const aiGeneratedQuiz = wrapAsync(async (req, res, next) => {
  
  const user = await User.findById(req.user._id);
  if (!user || user.role !== "professor")
    return next(new ExpressError(403, "Only professors can generate Quizes"));  


  const {data}=req.body;

  if(!data){
    return next(new ExpressError(400, "No data provided For Quiz Generation"));
  }
  
  console.log(data)
  let difficulty="";
  if(data.difficulty==='1'){
    difficulty="easy";
  }else if(data.difficulty==='2'){
    difficulty="medium";
  }else if(data.difficulty==='3'){
    difficulty="very hard with deep Knowledge of subject";
  }
  const ediData={
       topic:data.topic || "Maths", 
       mcqCount:data.mcqCount || 1,
       numericalCount:data.numericalCount ||0,
       questionCount:data.questionCount ||1,
       difficulty:difficulty,
       optionsCount:data.optionsCount<2||data.optionsCount>5?4:data.optionsCount
  }
  console.log(ediData);

  const genQuiz = await gemini(ediData);
  console.log(genQuiz);

 
res.status(200).json(genQuiz);

});

export const killSession = wrapAsync(async (req, res, next) => {
  const { email, examId } = req.body;
  if (!email || !examId) {
    return next(new ExpressError(400, "Email and Exam ID are required"));
  }

  const user = await User.findById(req.user._id);
  if (!user || user.role !== "professor") {
    return next(new ExpressError(403, "Only professors can kill sessions"));
  }

  const student = await User.findOne({ email });
  if (!student) {
    return next(new ExpressError(404, "Student not found"));
  }

  const response = await ExamResponses.findOne({ exam: examId, student: student._id });
  if (!response) {
    return next(new ExpressError(404, "Session not found for this student and exam"));
  }


  await response.deleteOne();

  
  await User.findByIdAndUpdate(student._id, {
    $pull: { responses: response._id }
  });



  res.status(200).json({ message: `Session of student ${student.email} has been killed successfully` });
});
