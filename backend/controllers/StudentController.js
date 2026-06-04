import wrapAsync from "../utils/wrapAsync.js";
import ExpressError from "../utils/ExpressError.js";
import User from "../DB/models/userModel.js";
import Exam from "../DB/models/ExamModel.js";
import ExamResponses from "../DB/models/ExamResponses.js";
import { sendMarksEmail } from "../utils/marksMailer.js";
import { getClientIp } from "../utils/ipHelper.js";


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

  if (exam.ipRestriction) {
    const clientIp = getClientIp(req);
    if (clientIp !== exam.allowedIp) {
      return next(new ExpressError(403, `IP Restriction Active. Your IP is ${clientIp || "unknown"}, which is not allowed. Please connect to the exam Wi-Fi or tell your professor your IP.`));
    }
  }

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


const calculateScore = (exam, answers, startTime) => {
  let marks = 0;
  const durationMs = exam.duration * 60 * 1000;
  const bufferMs = 1 * 60 * 1000; // 1 minute buffer
  const isLate = (Date.now() - startTime) > (durationMs + bufferMs);
  const isPastCloseAt = exam.closeAt && (Date.now() > (new Date(exam.closeAt).getTime() + bufferMs));

  if (isLate || isPastCloseAt) {
    return 0;
  }

  for (const { questionId, selectedAnswer } of answers) {
    const question = exam.questions.find((q) => q._id.toString() === questionId);
    if (!question) continue;

    if (selectedAnswer === question.correctAnswer) {
      marks += question.marks;
    } else if (!selectedAnswer || selectedAnswer === "unattempted") {
      marks += question.unattemptedMarks;
    } else {
      marks += question.negativeMarks;
    }
  }
  return marks;
};

export const startExamInfo = wrapAsync(async (req, res, next) => {
  const { examId } = req.params;
  const { _id } = req.user;

  const user = await User.findById(_id);
  if (!user) return next(new ExpressError(404, "User not found"));
  if (user.role !== "student")
    return next(new ExpressError(403, "Only students can start exams"));

  const exam = await Exam.findById(examId);
  if (!exam) return next(new ExpressError(404, "Invalid exam id"));

  if (exam.ipRestriction) {
    const clientIp = getClientIp(req);
    if (clientIp !== exam.allowedIp) {
      return next(new ExpressError(403, `IP Restriction Active. Your IP is ${clientIp || "unknown"}, which is not allowed. Please connect to the exam Wi-Fi or tell your professor your IP.`));
    }
  }

  let alResponse = await ExamResponses.findOne({ exam: examId, student: _id });
  if (alResponse?.status === "submitted") { 
    return next(new ExpressError(400, "You have already submitted this exam"));
  }
  
  res.status(200).json({
    message: "Exam details retrieved",
    alreadyStarted: !!alResponse,
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
});

export const startExam = wrapAsync(async (req, res, next) => {
  const { examId } = req.params;
  const { _id } = req.user;

  const user = await User.findById(_id);
  if (!user) return next(new ExpressError(404, "User not found"));
  if (user.role !== "student")
    return next(new ExpressError(403, "Only students can start exams"));

  const exam = await Exam.findById(examId);
  if (!exam) return next(new ExpressError(404, "Invalid exam id"));

  if (exam.ipRestriction) {
    const clientIp = getClientIp(req);
    if (clientIp !== exam.allowedIp) {
      return next(new ExpressError(403, `IP Restriction Active. Your IP is ${clientIp || "unknown"}, which is not allowed. Please connect to the exam Wi-Fi or tell your professor your IP.`));
    }
  }

  let alResponse = await ExamResponses.findOne({ exam: examId, student: _id });
  let response = null;

  if (alResponse) {
    if (alResponse.status === "submitted") {
      const savedResponses = {};
      alResponse.answers.forEach((ans) => {
        savedResponses[ans.questionId] = ans.selectedAnswer || "unattempted";
      });
      return res.status(200).json({
        startedTime: alResponse.startTime,
        endTime: new Date(alResponse.startTime).getTime() + exam.duration * 60 * 1000,
        currentTime: Date.now(),
        savedResponses,
        submitted: true,
        autoSubmitted: alResponse.autoSubmitted,
        reloadCount: alResponse.reloadCount,
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
    }

    // Increment reload count as a violation
    alResponse.reloadCount = (alResponse.reloadCount || 0) + 1;

    if (alResponse.reloadCount >= 3) {
      // Auto-submit exam
      alResponse.status = "submitted";
      alResponse.autoSubmitted = true;
      
      const startTime = new Date(alResponse.startTime).getTime();
      const marks = calculateScore(exam, alResponse.answers, startTime);
      alResponse.score = marks;
      await alResponse.save();

      if (!user.responses.includes(alResponse._id)) {
        user.responses.push(alResponse._id);
      }
      user.history.push({
        message: `Your exam named ${exam.title} was AUTO-SUBMITTED due to reload violation at ${new Date().toLocaleString('en-IN', DATE_FORMAT_OPTIONS)}`,
        createdAt: new Date(),
      });
      await user.save({ validateBeforeSave: false });

      try {
        const examWithProf = await Exam.findById(examId).populate("professor", "name");
        const profName = examWithProf.professor.name;
        sendMarksEmail(exam.title, profName, user.email, user.name, marks, exam.totalMarks);
      } catch (err) {
        console.error("Email send failed during auto-submit on reload", err);
      }

      const savedResponses = {};
      alResponse.answers.forEach((ans) => {
        savedResponses[ans.questionId] = ans.selectedAnswer || "unattempted";
      });

      return res.status(200).json({
        startedTime: alResponse.startTime,
        endTime: new Date(alResponse.startTime).getTime() + exam.duration * 60 * 1000,
        currentTime: Date.now(),
        savedResponses,
        submitted: true,
        autoSubmitted: true,
        reloadCount: alResponse.reloadCount,
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
    }

    await alResponse.save();
  } else {
    // First time starting
    response = new ExamResponses({
      exam: exam._id,
      student: user._id,
      answers: exam.questions.map(q => ({
        questionId: q._id,
        selectedAnswer: "unattempted"
      })),
      startTime: Date.now(),
      reloadCount: 0
    });
    await response.save();

    user.history.push({
      message: `You started the exam named: ${exam.title} at ${new Date().toLocaleString('en-IN', DATE_FORMAT_OPTIONS)}`,
      createdAt: new Date(),
    });
    await user.save({ validateBeforeSave: false });
  }

  const activeResponse = alResponse || response;
  const savedResponses = {};
  activeResponse.answers.forEach((ans) => {
    savedResponses[ans.questionId] = ans.selectedAnswer || "unattempted";
  });

  const startTimeMs = activeResponse.startTime.getTime();
  const durationMs = exam.duration * 60 * 1000;
  const closeAtMs = exam.closeAt ? new Date(exam.closeAt).getTime() : Infinity;
  const currentTimeMs = Date.now();
  const endTimeMs = Math.min(startTimeMs + durationMs, closeAtMs);

  res.status(200).json({
    startedTime: startTimeMs,
    endTime: endTimeMs,
    currentTime: currentTimeMs,
    savedResponses,
    submitted: false,
    reloadCount: activeResponse.reloadCount,
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

     const {responses, autoSubmitted}=req.body;
 
     
     if(Object.keys(responses).length!=exam.questions.length) return next(new ExpressError(400, "Invalid number of responses, Try to contact your professor."));

     const studentResponses = response;

     studentResponses.answers=responses;

     await studentResponses.save();

     user.responses.push(studentResponses._id);
     await user.save();

      //Marks Calculations
      let marks = 0;

      const startTime = new Date(response.startTime).getTime();
      const durationMs = exam.duration * 60 * 1000;
      const bufferMs = 1 * 60 * 1000; // 1 minute buffer
      const isLate = (Date.now() - startTime) > (durationMs + bufferMs);
      const isPastCloseAt = exam.closeAt && (Date.now() > (new Date(exam.closeAt).getTime() + bufferMs));

      if (isLate || isPastCloseAt) {
        marks = 0;
      } else {
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
      }
    
   

    const examWithProf = await Exam.findById(examId).populate("professor", "name");
    const profName = examWithProf.professor.name;
  
    

    sendMarksEmail(exam.title,profName,user.email,user.name,marks,exam.totalMarks);

    studentResponses.score=marks;
    studentResponses.status="submitted";
    studentResponses.autoSubmitted = autoSubmitted === true;
    await studentResponses.save();

    user.history.push({
      message : "You have submitted exam named " + exam.title + (isLate || isPastCloseAt ? " (LATE SUBMISSION)" : "") + " at " + new Date().toLocaleString('en-IN', DATE_FORMAT_OPTIONS),
      createdAt: new Date(),
     });

     await user.save({ validateBeforeSave: false });


     res.status(200).json({
       message: isLate || isPastCloseAt ? "Exam submitted successfully (Too Late! Submission penalty applied)" : "Exam submitted successfully",
       exam: {
         title: exam.title,
         examId: exam._id,
         description: exam.description,
         totalMarks:exam.totalMarks,
         score:marks
       }
     });



})


export const saveResponses = wrapAsync(async (req, res, next) => {
  const { examId, responses } = req.body;
  const { _id } = req.user;

  if (!examId) return next(new ExpressError(400, "examId is required"));
  if (!responses) return next(new ExpressError(400, "responses are required"));

  const responseDoc = await ExamResponses.findOne({
    exam: examId,
    student: _id,
  });

  if (!responseDoc) {
    return next(new ExpressError(400, "No exam response found to save."));
  }

  if (responseDoc.status === "submitted") {
    return next(new ExpressError(400, "Exam already submitted"));
  }

  responseDoc.answers = responses;
  await responseDoc.save();

  res.status(200).json({
    message: "Responses saved successfully",
  });
});


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
