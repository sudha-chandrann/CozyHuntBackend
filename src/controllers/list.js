import mongoose from "mongoose";
import { cloudinary } from "../middleware/multer.js";
import {
  Listing,
  ListLike,
  RentalRequest,
  VerificationDocument,
} from "../schema/list.model.js";

const CreateListing = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      title,
      category,
      subcategory,
      location,
      images,
      guestCount,
      roomCount,
      bathroomCount,
      rent,
      amenities,
      description,
    } = req.body;
    if (
      description.length === 0 ||
      !subcategory ||
      !title ||
      !category ||
      !guestCount ||
      !roomCount ||
      !bathroomCount ||
      !rent ||
      images.length === 0 ||
      !location ||
      amenities.length === 0
    ) {
      return res.status(400).json({
        message: "Please fill in all required fields",
        success: false,
        status: 400,
      });
    }
    const newList = new Listing({
      title,
      category,
      subcategory,
      location,
      images,
      guestCount,
      roomCount,
      bathroomCount,
      rent,
      amenities,
      description,
      ownerId: userId,
    });
    await newList.save();

    return res.status(201).json({
      message: "List is created successfully",
      data: newList,
      success: true,
      status: 201,
    });
  } catch (error) {
    console.error("CreatingList error:", error);
    return res.status(500).json({
      message: error.message || "Error Creating list",
      success: false,
      status: 500,
    });
  }
};

const getAllYourListings = async (req, res) => {
  try {
    const userId = req.user._id;
    const lists = await Listing.find({ ownerId: userId }).select(
      "title category subcategory rent  isVerified verificationStatus isAvailable"
    );

    return res.status(201).json({
      message: "List is found successfully",
      data: lists,
      success: true,
      status: 201,
    });
  } catch (error) {
    console.error("FindingLists error:", error);
    return res.status(500).json({
      message: error.message || "Error finding list",
      success: false,
      status: 500,
    });
  }
};

const getListByIdForLandlord = async (req, res) => {
  try {
    const { listId } = req.params;
    const userId = req.user._id;

    const list = await Listing.findOne({ _id: listId, ownerId: userId });

    if (!list) {
      return res.status(404).json({
        message: "Listing not found or you are not authorized to view it.",
        success: false,
        status: 404,
      });
    }

    return res.status(200).json({
      message: "Listing retrieved successfully.",
      data: list,
      success: true,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching listing by ID:", error);
    return res.status(500).json({
      message: error.message || "An error occurred while fetching the listing.",
      success: false,
      status: 500,
    });
  }
};

const updateList = async (req, res) => {
  try {
    const { listId } = req.params;
    const userId = req.user._id;
    const updateData = req.body;
    const existingList = await Listing.findOne({
      _id: listId,
      ownerId: userId,
    });
    if (!existingList) {
      return res.status(404).json({
        message: "Listing not found or you are not authorized to update it.",
        success: false,
        status: 404,
      });
    }

    const updatedList = await Listing.findByIdAndUpdate(
      listId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!updatedList) {
      return res.status(404).json({
        message: "Listing not found or update failed.",
        success: false,
        status: 404,
      });
    }

    return res.status(200).json({
      message: "Listing updated successfully.",
      data: updatedList,
      success: true,
      status: 200,
    });
  } catch (error) {
    console.error("Update listing error:", error);
    return res.status(500).json({
      message: error.message || "An error occurred while updating the listing.",
      success: false,
      status: 500,
    });
  }
};

const getVerificationDocuments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { listId } = req.params;
    const existingList = await Listing.findOne({
      _id: listId,
      ownerId: userId,
    }).select(
      "title category subcategory location isVerified verificationStatus"
    );
    if (!existingList) {
      return res.status(404).json({
        message: "Listing not found or you are not authorized to get it.",
        success: false,
        status: 404,
      });
    }
    const existingDocuments = await VerificationDocument.find({
      ListId: listId,
    });

    return res.status(200).json({
      message: "Documents retrieved successfully!",
      success: true,
      status: 200,
      data: {
        doc: existingDocuments || [],
        list: existingList,
      },
    });
  } catch (error) {
    console.error("Retrieval error:", error);
    return res.status(500).json({
      message: error.message || "An error occurred while retrieving documents",
      success: false,
      status: 500,
    });
  }
};

const uploadVerificationDocuments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { listId } = req.params;
    const documentTypes = req.body.documentTypes;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        message: "No files uploaded. Please select at least one document.",
        success: false,
        status: 400,
      });
    }

    if (!documentTypes) {
      return res.status(400).json({
        message: "Document types must be provided for all files.",
        success: false,
        status: 400,
      });
    }

    const typesArray = Array.isArray(documentTypes)
      ? documentTypes
      : [documentTypes];

    if (typesArray.length !== files.length) {
      return res.status(400).json({
        message: "Document types must be provided for all files.",
        success: false,
        status: 400,
      });
    }

    const listing = await Listing.findById(listId);
    if (!listing) {
      return res.status(404).json({
        message: "Listing not found.",
        success: false,
        status: 404,
      });
    }

    if (listing.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({
        message:
          "You don't have permission to upload documents for this listing.",
        success: false,
        status: 403,
      });
    }

    const existingDocuments = await VerificationDocument.findOne({
      ListId: listId,
      status: { $in: ["pending", "approved"] },
    });

    if (existingDocuments) {
      for (const file of files) {
        try {
          await cloudinary.uploader.destroy(file.filename);
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError);
        }
      }
      return res.status(400).json({
        message:
          "Verification documents are already submitted for this listing.",
        success: false,
        status: 400,
      });
    }

    const savedDocuments = files.map((file, index) => ({
      documentType: typesArray[index],
      documentUrl: file.path,
      publicId: file.filename,
      originalName: file.originalname,
      fileSize: file.size,
      uploadedAt: new Date(),
    }));

    const verificationDocument = new VerificationDocument({
      userId: userId,
      documents: savedDocuments,
      ListId: listId,
      status: "pending",
      submittedAt: new Date(),
    });

    await verificationDocument.save();

    await Listing.findByIdAndUpdate(listId, {
      verificationStatus: "pending",
    });

    return res.status(200).json({
      message:
        "Documents uploaded successfully! Your house verification request has been submitted.",
      success: true,
      status: 200,
      data: {
        listingId: listId,
        documentsUploaded: savedDocuments.length,
        document: verificationDocument,
      },
    });
  } catch (error) {
    console.error("Upload verification documents error:", error);

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          if (file.filename) {
            await cloudinary.uploader.destroy(file.filename);
          }
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError);
        }
      }
    }

    return res.status(500).json({
      message: error.message || "An error occurred while uploading documents",
      success: false,
      status: 500,
    });
  }
};

const updateAvailability = async (req, res) => {
  try {
    const userId = req.user._id;
    const { listId } = req.params;
    const { isAvailable } = req.body;

    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({
        message: "isAvailable must be a boolean value",
        success: false,
        status: 400,
      });
    }

    const existingList = await Listing.findOne({
      _id: listId,
      ownerId: userId,
    });

    if (!existingList) {
      return res.status(404).json({
        message: "Listing not found or you are not authorized to update it.",
        success: false,
        status: 404,
      });
    }

    if (!existingList.isVerified) {
      return res.status(403).json({
        message:
          "Listing is not verified. Only verified listings can have their availability updated.",
        success: false,
        status: 403,
      });
    }

    existingList.isAvailable = isAvailable;
    await existingList.save();

    return res.status(200).json({
      message: `Listing availability updated successfully to ${
        isAvailable ? "available" : "unavailable"
      }!`,
      success: true,
      status: 200,
      data: {
        listId: existingList._id,
        isAvailable: existingList.isAvailable,
        updatedAt: existingList.updatedAt || new Date(),
      },
    });
  } catch (error) {
    console.error("Update availability error:", error);
    return res.status(500).json({
      message:
        error.message ||
        "An error occurred while updating listing availability",
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
    filter.isVerified = true;

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
      .sort(sortObject)
      .skip(skipCount)
      .limit(limitNumber);

    // Get total count for pagination
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

const getLiked = async (req, res) => {
  try {
    const { listId } = req.params;

    const userId = req.user._id;

    const likeplace = await ListLike.findOne({
      userId: userId,
      ListId: listId,
    });

    if (!likeplace) {
      return res.status(200).json({
        message: "Place is not Liked by you",
        data: false,
        success: true,
        status: 200,
      });
    }

    return res.status(200).json({
      message: "Place is  Liked by you",
      data: true,
      success: true,
      status: 200,
    });
  } catch (error) {
    console.log(" the error during geting liked", error);
    return res.status(500).json({
      message: error.message || "Error checking like status",
      success: false,
      status: 500,
    });
  }
};

const toggleLiked = async (req, res) => {
  try {
    const { listId } = req.params;

    const userId = req.user._id;

    const likeplace = await ListLike.findOne({
      userId: userId,
      ListId: listId,
    });

    if (!likeplace) {
      await ListLike.create({
        userId: userId,
        ListId: listId,
      });
      return res.status(200).json({
        message: "Listing added to favorites",
        data: true,
        success: true,
        status: 200,
      });
    }

    await ListLike.deleteOne({
      userId: userId,
      ListId: listId,
    });
    return res.status(200).json({
      message: "Listing removed from favorites",
      data: false,
      success: true,
      status: 200,
    });
  } catch (error) {
    console.log(" the error during geting liked", error);
    return res.status(500).json({
      message: error.message || "Error toggling like",
      success: false,
      status: 500,
    });
  }
};

const getAllLikedLists = async (req, res) => {
  try {
    const userId = req.user._id;

    const pipeline = [
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: "listings",
          localField: "ListId",
          foreignField: "_id",
          as: "listing",
        },
      },
      {
        $unwind: "$listing",
      },
      {
        $match: {
          "listing.isVerified": true,
          "listing.isAvailable": true,
        },
      },
    ];

    pipeline.push({
      $project: {
        _id: "$listing._id",
        title: "$listing.title",
        category: "$listing.category",
        subcategory: "$listing.subcategory",
        location: "$listing.location",
        images: "$listing.images",
        guestCount: "$listing.guestCount",
        roomCount: "$listing.roomCount",
        bathroomCount: "$listing.bathroomCount",
        rent: "$listing.rent",
        amenities: "$listing.amenities",
        description: "$listing.description",
        isAvailable: "$listing.isAvailable",
        isVerified: "$listing.isVerified",
        verificationStatus: "$listing.verificationStatus",
      },
    });

    const likedListings = await ListLike.aggregate(pipeline);

    return res.status(200).json({
      message: "Liked listings found successfully",
      data: likedListings,
      success: true,
      status: 200,
    });
  } catch (error) {
    console.error("FindingLikedLists error:", error);
    return res.status(500).json({
      message: error.message || "Error finding liked listings",
      success: false,
      status: 500,
    });
  }
};

const getListById = async (req, res) => {
  try {
    const { listId } = req.params;
    const userId = req.user._id;

    const list = await Listing.findOne({
      _id: listId,
      isVerified: true,
    }).populate({
      path: "ownerId",
      select: "name email verificationStatus verified profileImage",
    });

    if (!list) {
      return res.status(404).json({
        message: "Listing not found or you are not authorized to view it.",
        success: false,
        status: 404,
      });
    }

    const isLiked = await ListLike.findOne({ userId, ListId: listId });

    const existingRequest = await RentalRequest.findOne({
      tenantId: userId,
      listingId: listId,
      status:"pending",
    });

    const canRequest = !existingRequest && list.isAvailable;

    return res.status(200).json({
      message: "Listing retrieved successfully.",
      data: {
        listing: list,
        owner: list.ownerId,
        isLiked: !!isLiked,
        hasRequested: !!existingRequest,
        canRequest,
      },
      success: true,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching listing by ID:", error);
    return res.status(500).json({
      message: error.message || "An error occurred while fetching the listing.",
      success: false,
      status: 500,
    });
  }
};

const createRentalRequest = async (req, res) => {
  try {
    const { listId } = req.params;
    const userId = req.user._id;
    const { message, scheduledVisit } = req.body;

    const list = await Listing.findOne({ _id: listId, isVerified: true });

    if (!list) {
      return res.status(404).json({
        message: "Listing not found or not verified for rental requests.",
        success: false,
        status: 404,
      });
    }

    const existingRequest = await RentalRequest.findOne({
      tenantId: userId,
      listingId: listId,
      status:"pending"
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "You have already requested to rent this property.",
        success: false,
        status: 400,
      });
    }

    const newRequest = new RentalRequest({
      tenantId: userId,
      listingId: listId,
      message,
      scheduledVisit,
    });

    await newRequest.save();

    return res.status(201).json({
      message: "Rental request sent successfully.",
      data: newRequest,
      success: true,
      status: 201,
    });
  } catch (error) {
    console.error("Error creating rental request:", error);
    return res.status(500).json({
      message:
        error.message || "An error occurred while creating the rental request.",
      success: false,
      status: 500,
    });
  }
};

const getAllRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const listings = await Listing.find({ ownerId: userId }).select("_id");
    const listingIds = listings.map((listing) => listing._id);

    if (listingIds.length === 0) {
      return res.status(200).json({
        message: "No rental requests found — you don't have any listings.",
        data: [],
        success: true,
        status: 200,
      });
    }

    const requests = await RentalRequest.find({
      listingId: { $in: listingIds },
    })
      .populate(
        "tenantId",
        "name email profileImage verificationStatus verified"
      )
      .populate(
        "listingId",
        "title category subcategory rent location isAvailable"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Rental requests retrieved successfully.",
      data: requests,
      success: true,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching rental requests:", error);
    return res.status(500).json({
      message:
        error.message || "An error occurred while retrieving rental requests.",
      success: false,
      status: 500,
    });
  }
};

const replyToRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { requestId } = req.params;
    const { status, replyMessage } = req.body;

    const allowedStatuses = ["pending", "accepted", "rejected", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status value.",
        success: false,
        status: 400,
      });
    }

    const request = await RentalRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        message: "Rental request not found.",
        success: false,
        status: 404,
      });
    }

    const listing = await Listing.findById(request.listingId);
    if (!listing || String(listing.ownerId) !== String(userId)) {
      return res.status(403).json({
        message: "You are not authorized to respond to this request.",
        success: false,
        status: 403,
      });
    }
    request.status = status;
    if (replyMessage) {
      request.landlordResponseMessage = replyMessage;
    }
    request.respondedAt = new Date();
    await request.save();

    const updatedRequest = await RentalRequest.findById(requestId)
      .populate(
        "tenantId",
        "name email profileImage verificationStatus verified"
      )
      .populate(
        "listingId",
        "title category subcategory rent location isAvailable"
      );

    return res.status(200).json({
      message: "Rental request updated successfully.",
      data: updatedRequest,
      success: true,
      status: 200,
    });
  } catch (error) {
    console.error("Error updating rental request:", error);
    return res.status(500).json({
      message:
        error.message || "An error occurred while updating the rental request.",
      success: false,
      status: 500,
    });
  }
};

const getAllusersRequest = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await RentalRequest.find({ tenantId: userId })
      .populate("tenantId", "name email profileImage verificationStatus verified")
      .populate({
        path: "listingId",
        select: "title category subcategory rent location isAvailable ownerId verificationStatus isVerified",
        populate: {
          path: "ownerId",
          select: "name email profileImage verificationStatus verified",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Rental requests retrieved successfully.",
      data: requests || [],
      success: true,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching rental requests:", error);
    return res.status(500).json({
      message:
        error.message || "An error occurred while retrieving rental requests.",
      success: false,
      status: 500,
    });
  }
};

const cancelRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { requestId } = req.params;

    const request = await RentalRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        message: "Rental request not found.",
        success: false,
        status: 404,
      });
    }

    if ( String(request.tenantId) !== String(userId)) {
      return res.status(403).json({
        message: "You are not authorized to cancel to this request.",
        success: false,
        status: 403,
      });
    }
    request.status = "cancelled";
    await request.save();

    const updatedRequest = await RentalRequest.findById(requestId)
      .populate("tenantId", "name email profileImage verificationStatus verified")
      .populate({
        path: "listingId",
        select: "title category subcategory rent location isAvailable ownerId verificationStatus isVerified",
        populate: {
          path: "ownerId",
          select: "name email profileImage verificationStatus verified",
        },
      })

    return res.status(200).json({
      message: "Rental request cancelled successfully.",
      data: updatedRequest,
      success: true,
      status: 200,
    });
  } catch (error) {
    console.error("Error updating rental request:", error);
    return res.status(500).json({
      message:
        error.message || "An error occurred while canceling the rental request.",
      success: false,
      status: 500,
    });
  }
};


export {
  CreateListing,
  getAllYourListings,
  getListByIdForLandlord,
  updateList,
  getVerificationDocuments,
  uploadVerificationDocuments,
  updateAvailability,
  getAllListings,
  getLiked,
  toggleLiked,
  getAllLikedLists,
  getListById,
  createRentalRequest,
  getAllRequest,
  replyToRequest,
  getAllusersRequest,
  cancelRequest
};
