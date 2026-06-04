import express from "express";
const router = express.Router();
import { googleLogin,register ,login, logout,verify} from "../controllers/userController.js";
import authenticate from "../middlewares/authentication.js";



router.route("/register")
        .post(register);
router.route("/login")
        .post(login);
router.route("/logout")
        .post(authenticate,logout)
router.route("/verify")
        .get(authenticate,verify)
router.route("/googleLogin")
        .post(googleLogin)

export default router;