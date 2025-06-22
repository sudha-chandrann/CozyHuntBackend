import { Router } from "express";
import { verifyJWT } from "../middleware/auth.js";
import { CreateListing } from "../controllers/list.js";
const router=Router()
router.route("/createlist").post(verifyJWT,CreateListing);
export default router;

