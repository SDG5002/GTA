import express from "express";
const router = express.Router();
import { getReports, joinExam,startExamInfo ,startExam,submitExam,getResponses,quickReportsForStudentHome,saveResponses} from "../controllers/StudentController.js";
import authenticate from "../middlewares/authentication.js";

router.route("/joinExam")
        .post(authenticate,joinExam);
router.route("/startExam/:examId")
        .get(authenticate,startExam);
router.route("/submitExam/:examId")
        .post(authenticate,submitExam);
router.route("/saveResponses")
        .post(authenticate,saveResponses);
router.route("/getReports")
        .get(authenticate,getReports);
router.route("/getResponse/:examId")
        .get(authenticate,getResponses);
router.route("/quickReportsForStudentHome")        
        .get(authenticate,quickReportsForStudentHome);
router.route("/startExamInfo/:examId")        
        .get(authenticate,startExamInfo);



export default router;

