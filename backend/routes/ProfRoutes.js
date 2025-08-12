import express from "express";
const router = express.Router();
import { killSession,manageSessions,uploadExam, aiGeneratedQuiz ,deleteExam, getExams,getExam,getAnalysis,getStats,reReleaseResults} from "../controllers/ProfController.js";
import authenticate from "../middlewares/authentication.js";


router.route("/uploadExam")
        .post(authenticate,uploadExam);
router.route("/getExams")
        .get(authenticate,getExams)
router.route("/getExam/:examId")
        .get(authenticate,getExam)
router.route("/getAnalysis/:examId")
        .get(authenticate,getAnalysis);
router.route("/getStats")
        .get(authenticate,getStats);
router.route("/manageSessions/:examId")
        .get(authenticate,manageSessions);
router.route("/deleteExam/:examId")
        .delete(authenticate,deleteExam);
router.route("/reReleaseResults/:examId")
        .put(authenticate,reReleaseResults);
router.route("/aiGeneratedQuiz")
        .post(authenticate,aiGeneratedQuiz);
router.route("/killSession")
        .post(authenticate,killSession);

export default router;

