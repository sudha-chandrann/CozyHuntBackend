import { Router } from "express";
import { verifyJWT } from "../middleware/auth.js";
import { cancelRequest, CreateListing, createRentalRequest, getAllLikedLists, getAllListings, getAllRequest, getAllusersRequest, getAllYourListings, getLiked, getListById, getListByIdForLandlord, getVerificationDocuments, replyToRequest, toggleLiked, updateAvailability, updateList, uploadVerificationDocuments } from "../controllers/list.js";
import { handleCloudinaryUpload, upload } from "../middleware/multer.js";
const router=Router()
router.route("/createlist").post(verifyJWT,CreateListing);
router.route("/getyourlistings").get(verifyJWT,getAllYourListings);
router.route("/getalllistings").get(verifyJWT,getAllListings);
router.route("/getalllikedLists").get(verifyJWT,getAllLikedLists);
router.route('/landlordlist/:listId').get(verifyJWT, getListByIdForLandlord);
router.route('/getlist/:listId').get(verifyJWT, getListById);

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
router.route("/createrentalRequest/:listId").post(verifyJWT,createRentalRequest);
router.route("/getallRequests").get(verifyJWT,getAllRequest);
router.route("/request/:requestId/status").post(verifyJWT,replyToRequest);
router.route("/request/:requestId/status").put(verifyJWT,cancelRequest);
router.route("/getAllusersRequests").get(verifyJWT,getAllusersRequest);

export default router;

