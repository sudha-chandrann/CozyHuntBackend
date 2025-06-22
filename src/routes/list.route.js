import { Router } from "express";
import { verifyJWT } from "../middleware/auth.js";
import { CreateListing, getAllLikedLists, getAllListings, getAllYourListings, getLiked, getListByIdForLandlord, getVerificationDocuments, toggleLiked, updateAvailability, updateList, uploadVerificationDocuments } from "../controllers/list.js";
import { handleCloudinaryUpload, upload } from "../middleware/multer.js";
const router=Router()
router.route("/createlist").post(verifyJWT,CreateListing);
router.route("/getyourlistings").get(verifyJWT,getAllYourListings);
router.route("/getalllistings").get(verifyJWT,getAllListings);
router.route("/getalllikedLists").get(verifyJWT,getAllLikedLists);
router.route('/landlordlist/:listId').get(verifyJWT, getListByIdForLandlord);
router.route('/update/:listId').put(verifyJWT,updateList);
router.route('/getDocuments/:listId').get(verifyJWT,getVerificationDocuments);
router.post("/verifydocument/:listId", 
  verifyJWT,
  upload.array('documents', 5),
  handleCloudinaryUpload,
  uploadVerificationDocuments
);
router.route("/availability/:listId").put(verifyJWT,updateAvailability)
router.route("/listlike/:listId").get(verifyJWT,getLiked);
router.route("/listlike/:listId").put(verifyJWT,toggleLiked);



export default router;

