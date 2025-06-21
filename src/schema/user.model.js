import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user','admin'], required: true , default:'user'},
  profileImage: {type:String},
  verified: { type: Boolean, default: false },
  verficationCode:{type:String,default:''},
  verficationCodeExpires:{ type: Date,default: null},
  IsVerfied:{type:Boolean, default:false},
  verificationDocuments: [{
    documentType: { type :String},
    documentUrl: {type : String},
    publicId: { type: String},
    uploadedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  }],
  verificationStatus: { type: String, enum: ['unverified', 'pending', 'verified', 'rejected'], default: 'unverified' },
  verificationNote: { type: String }
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.isPasswordCorrect = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    console.log("something went wrong during comparing the password ", error);
    throw error;
  }
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: 24 * 60 * 60 * 1000,
    }
  );
};

const verificationRequestSchema = new Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  documents: [{
    documentType: { 
      type: String, 
      required: true 
    },
    documentUrl: { 
      type: String, 
      required: true 
    },
    publicId: { 
      type: String, 
      required: true 
    },
    originalName: { 
      type: String, 
      required: true 
    },
    fileSize: { 
      type: Number, 
      required: true 
    },
    uploadedAt: { 
      type: Date, 
      default: Date.now 
    }
  }],

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  adminNotes: { 
    type: String 
  },
  submittedAt: { 
    type: Date, 
    default: Date.now 
  },
  reviewedAt: { 
    type: Date 
  },
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, {
  timestamps: true
});

const VerificationRequest = mongoose.model('VerificationRequest', verificationRequestSchema);
const User = mongoose.model("User", userSchema);

export {  User,VerificationRequest};
