import { Router } from "express";
import { getcurrentUser, getVerificationDocuments, loginUser, logout, registerUser, sendVerificationCode, uploadVerificationDocuments, verifyEmail } from "../controllers/user.js";
import { verifyJWT } from "../middleware/auth.js";
import { handleCloudinaryUpload, upload } from "../middleware/multer.js";
const router=Router()
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(verifyJWT,logout);
router.route("/sendverfication").post(sendVerificationCode);
router.route('/verifyEmail').post(verifyEmail)
router.route('/getcurrentuser').get(verifyJWT,getcurrentUser); 
router.post("/identity", 
  verifyJWT,
  upload.array('documents', 5),
  handleCloudinaryUpload,
  uploadVerificationDocuments
);
router.route('/getDocuments').get(verifyJWT,getVerificationDocuments);
export default router;

