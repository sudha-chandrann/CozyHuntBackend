import { Router } from "express";
import { verifyJWT } from "../middleware/auth.js";
import { getAllListsVerifications, getAllUsersVerifications, getListVerificationById, getUserVerificationById, updateUserVerificationStatus,updateListVerificationStatus, getAllListings, getAllUsers } from "../controllers/admin.js";
const router=Router()
router.route("/userverfication").get(verifyJWT,getAllUsersVerifications);
router.route("/listverfication").get(verifyJWT,getAllListsVerifications);
router.route("/userrequest/:requestId").get(verifyJWT,getUserVerificationById);
router.route("/userrequest/:requestId").patch(verifyJWT,updateUserVerificationStatus);
router.route("/listrequest/:requestId").get(verifyJWT,getListVerificationById);
router.route("/listrequest/:requestId").patch(verifyJWT,updateListVerificationStatus);
router.route("/getallListings").get(verifyJWT,getAllListings);
router.route("/getallUsers").get(verifyJWT,getAllUsers);


export default router;

