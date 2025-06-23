import mongoose from "mongoose";

const ListingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      enum: ["room", "flat", "pg", "studio"],
      required: true,
    },
    subcategory: {
      type: String,
      required: true,
      enum: [
        "single",
        "shared",
        "1bhk",
        "2bhk",
        "3bhk",
        "boys",
        "girls",
        "co-ed",
        "standard",
        "premium",
      ],
    },
    location: {
      value: { type: String, required: true },
      label: { type: String, required: true },
      latlng: {
        type: [Number],
        validate: [(arr) => arr.length === 2, "latlng must be [lat, lng]"],
        required: true,
      },
      region: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
    },
    images: [
      {
        url: { type: String, required: true },
        label: {
          type: String,
          enum: [
            "bedroom",
            "kitchen",
            "bathroom",
            "living_room",
            "exterior",
            "other",
          ],
          default: "other",
        },
      },
    ],
    guestCount: {
      type: Number,
      required: true,
      min: 1,
    },
    roomCount: {
      type: Number,
      required: true,
      min: 1,
    },
    bathroomCount: {
      type: Number,
      required: true,
      min: 1,
    },
    rent: {
      type: Number,
      required: true,
      min: 0,
    },
    amenities: {
      type: [String],
      default: [],
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const VerificationDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documents: [
      {
        documentType: {
          type: String,
          enum: [
            "title_deed",
            "electricity_bill",
            "water_bill",
            "property_tax",
            "rental_agreement",
            "other",
          ],
          required: true,
        },
        documentUrl: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
        originalName: {
          type: String,
          required: true,
        },
        fileSize: {
          type: Number,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    ListId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNotes: {
      type: String,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const ListLikeSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ListId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
})


const RentalRequestSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
    },
    scheduledVisit: {
      type: Date, 
    },
    respondedAt: {
      type: Date, 
    },
    landlordResponseMessage: {
      type: String,
      default: "",
    }
  },
  { timestamps: true }
);

const RentalRequest = mongoose.model("RentalRequest", RentalRequestSchema);
const VerificationDocument = mongoose.model("VerificationDocument", VerificationDocumentSchema);
const Listing = mongoose.model("Listing", ListingSchema);
const ListLike= mongoose.model("ListLike",ListLikeSchema)
export { Listing, VerificationDocument,ListLike,RentalRequest};
