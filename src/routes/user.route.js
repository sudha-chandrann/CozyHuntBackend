import { Router } from "express";
import { getcurrentUser, loginUser, logout, registerUser, sendVerificationCode, verifyEmail } from "../controllers/user.js";
import { verifyJWT } from "../middleware/auth.js";
const router=Router()
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(verifyJWT,logout);
router.route("/sendverfication").post(sendVerificationCode);
router.route('/verifyEmail').post(verifyEmail)
router.route('/getcurrentuser').get(verifyJWT,getcurrentUser); 

export default router;