import { Listing, VerificationDocument } from "../schema/list.model.js";
import { User, VerificationRequest } from "../schema/user.model.js";

const getAllUsersVerifications = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Unauthorized access",
        success: false,
        status: 403,
      });
    }

    const {
      search = "",
      limit = 12,
      page = 1,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    if (search) {
      query["$or"] = [
        { "documents.documentType": { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
      ];
    }

    const total = await VerificationRequest.countDocuments(query);

    const requests = await VerificationRequest.find(query)
      .populate("userId", "name email profileImage verificationStatus role")
      .populate("reviewedBy", "name email profileImage role")
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.status(200).json({
      message: "Verification requests retrieved successfully",
      success: true,
      status: 200,
      data: {
        total,
        page: Number(page),
        limit: Number(limit),
        requests,
      },
    });
  } catch (error) {
    console.error("Error fetching verification requests:", error);
    return res.status(500).json({
      message: error.message || "An error occurred while retrieving requests",
      success: false,
      status: 500,
    });
  }
};

const getAllListsVerifications = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Unauthorized access",
        success: false,
        status: 403,
      });
    }

    const {
      search = "",
      limit = 12,
      page = 1,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    if (search) {
      query["$or"] = [
        { "documents.documentType": { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
      ];
    }

    const total = await VerificationDocument.countDocuments(query);

    const requests = await VerificationDocument.find(query)
      .populate("userId", "name email profileImage verificationStatus role")
      .populate("ListId", "title category subcategory verificationStatus rent location ownerId")

      .populate("reviewedBy", "name email profileImage role")
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.status(200).json({
      message: "Verification requests retrieved successfully",
      success: true,
      status: 200,
      data: {
        total,
        page: Number(page),
        limit: Number(limit),
        requests,
      },
    });
  } catch (error) {
    console.error("Error fetching verification requests:", error);
    return res.status(500).json({
      message: error.message || "An error occurred while retrieving requests",
      success: false,
      status: 500,
    });
  }
};

const getUserVerificationById = async (req, res) => {
  try {
    const user = req.user;
    const { requestId } = req.params;

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Unauthorized access",
        success: false,
        status: 403,
      });
    }

    const request = await VerificationRequest.findById(requestId)
      .populate("userId", "name email profileImage verificationStatus role")
      .populate("reviewedBy", "name email profileImage role");

    if (!request) {
      return res.status(403).json({
        message: "Verfication is not found",
        success: false,
        status: 403,
      });
    }

    return res.status(200).json({
      message: "Verification request retrieved successfully",
      success: true,
      status: 200,
      data: request,
    });
  } catch (error) {
    console.error("Error fetching verification requests:", error);
    return res.status(500).json({
      message: error.message || "An error occurred while retrieving request",
      success: false,
      status: 500,
    });
  }
};

const updateUserVerificationStatus = async (req, res) => {
  try {
    const user = req.user;
    const { requestId } = req.params;
    const { status, adminNotes } = req.body;

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Unauthorized access",
        success: false,
        status: 403,
      });
    }

    const request = await VerificationRequest.findById(requestId).populate(
      "userId",
      "name email profileImage verificationStatus role"
    );

    if (!request) {
      return res.status(403).json({
        message: "Verfication is not found",
        success: false,
        status: 403,
      });
    }

    const updatedRequest = await VerificationRequest.findByIdAndUpdate(
      requestId,
      {
        status,
        adminNotes,
        reviewedAt: new Date(),
        reviewedBy: user._id,
      },
      { new: true }
    );

    if (status === "approved") {
      await User.findByIdAndUpdate(updatedRequest.userId, {
        verificationStatus: "verified",
        verified: true,
      });
    }

    const updaterequest = await VerificationRequest.findById(requestId)
      .populate("userId", "name email profileImage verificationStatus role")
      .populate("reviewedBy", "name email profileImage role");

    return res.status(200).json({
      message: `Request ${status} successfully`,
      success: true,
      status: 200,
      data: updaterequest,
    });
  } catch (error) {
    console.error("Error updating verification requests:", error);
    return res.status(500).json({
      message: error.message || "An error occurred while updating request",
      success: false,
      status: 500,
    });
  }
};

const getListVerificationById = async (req, res) => {
  try {
    const user = req.user;
    const { requestId } = req.params;

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Unauthorized access",
        success: false,
        status: 403,
      });
    }

    const request = await VerificationDocument.findById(requestId)
      .populate("userId", "name email profileImage verificationStatus role")
      .populate("ListId" , "title category subcategory verificationStatus rent location ")
      .populate("reviewedBy", "name email profileImage role")

    if (!request) {
      return res.status(403).json({
        message: "Verfication is not found",
        success: false,
        status: 403,
      });
    }

    return res.status(200).json({
      message: "Verification request retrieved successfully",
      success: true,
      status: 200,
      data: request,
    });
  } catch (error) {
    console.error("Error fetching verification requests:", error);
    return res.status(500).json({
      message: error.message || "An error occurred while retrieving request",
      success: false,
      status: 500,
    });
  }
};

const updateListVerificationStatus = async (req, res) => {
  try {
    const user = req.user;
    const { requestId } = req.params;
    const { status, adminNotes } = req.body;

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Unauthorized access",
        success: false,
        status: 403,
      });
    }

    const request = await VerificationDocument.findById(requestId);

    if (!request) {
      return res.status(403).json({
        message: "Verfication is not found",
        success: false,
        status: 403,
      });
    }

    const updatedRequest = await VerificationDocument.findByIdAndUpdate(
      requestId,
      {
        status,
        adminNotes,
        reviewedAt: new Date(),
        reviewedBy: user._id,
      },
      { new: true }
    );

    if (status === "approved") {
      await Listing.findByIdAndUpdate(updatedRequest.ListId, {
        verificationStatus: "verified",
        isVerified: true,
      });
    }

    const updaterequest = await VerificationDocument.findById(requestId)
      .populate("userId", "name email profileImage verificationStatus role")
      .populate("ListId" , "title category subcategory verificationStatus rent location ")
      .populate("reviewedBy", "name email profileImage role");

    return res.status(200).json({
      message: `Request ${status} successfully`,
      success: true,
      status: 200,
      data: updaterequest,
    });
  } catch (error) {
    console.error("Error updating verification requests:", error);
    return res.status(500).json({
      message: error.message || "An error occurred while updating request",
      success: false,
      status: 500,
    });
  }
};

const getAllListings = async (req, res) => {
  try {
    const {
      category,
      search,
      limit = 12,
      page = 1,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};

    if (category && typeof category === "string") {
      filter.category = { $regex: new RegExp(category, "i") };
    }

    if (search && typeof search === "string") {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { "location.value": searchRegex },
        { category: searchRegex },
        { subcategory: searchRegex },
      ];
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skipCount = (pageNumber - 1) * limitNumber;

    const sortObject = {};
    sortObject[sortBy] = sortOrder === "asc" ? 1 : -1;

    const listings = await Listing.find(filter)
      .populate("ownerId","name email role verified verificationStatus profileImage")
      .sort(sortObject)
      .skip(skipCount)
      .limit(limitNumber);

    const totalCount = await Listing.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limitNumber);

    return res.status(200).json({
      message: "Listings found successfully",
      data: {
        listings,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalCount,
          hasNextPage: pageNumber < totalPages,
          hasPrevPage: pageNumber > 1,
          limit: limitNumber,
        },
      },
      success: true,
      status: 200,
    });
  } catch (error) {
    console.error("FindingLists error:", error);
    return res.status(500).json({
      message: error.message || "Error finding listings",
      success: false,
      status: 500,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const {
      category,
      search,
      limit = 12,
      page = 1,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};

    if (category && typeof category === "string") {
      filter.role = { $regex: new RegExp(category, "i") };
    }

    if (search && typeof search === "string") {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { verificationStatus: searchRegex },
        { role: searchRegex },
      ];
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skipCount = (pageNumber - 1) * limitNumber;

    const sortObject = {};
    sortObject[sortBy] = sortOrder === "asc" ? 1 : -1;

    const users = await User.find(filter)
      .sort(sortObject)
      .skip(skipCount)
      .limit(limitNumber);

    const totalCount = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limitNumber);

    return res.status(200).json({
      message: "Users found successfully",
      data: {
        users,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalCount,
          hasNextPage: pageNumber < totalPages,
          hasPrevPage: pageNumber > 1,
          limit: limitNumber,
        },
      },
      success: true,
      status: 200,
    });
  } catch (error) {
    console.error("FindingUsers error:", error);
    return res.status(500).json({
      message: error.message || "Error finding users",
      success: false,
      status: 500,
    });
  }
};

export {
  getAllUsersVerifications,
  getAllListsVerifications,
  getUserVerificationById,
  updateUserVerificationStatus,
  getListVerificationById,
  updateListVerificationStatus,
  getAllListings,
  getAllUsers
};
