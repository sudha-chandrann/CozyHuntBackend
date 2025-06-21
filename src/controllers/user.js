import { cloudinary } from "../middleware/multer.js";
import { User, VerificationRequest } from "../schema/user.model.js";
import { sendVerifyEmail } from "../utils/sendVerifyEmail.js";

const registerUser = async (req, res) => {
  try {
    const { name, email, password, profileImage } = req.body;
    if (!name || !email || !password || !profileImage) {
      return res.status(400).json({
        message: "Please fill in all required fields",
        success: false,
        status: 400,
      });
    }
    const existingUser = await User.findOne({email});

    if (existingUser) {
      if (existingUser.IsVerfied) {
        return res.status(409).json({
          message: "User with this email  already exists",
          success: false,
          status: 409,
        });
      }
      await User.deleteOne({ _id: existingUser._id });
    }

    const newUser = await User.create({
      name,
      password,
      profileImage: profileImage || "",
      email,
      role:'user'
    });

    if (!newUser) {
      return res.status(500).json({
        message: "Failed to create user account",
        success: false,
        status: 500,
      });
    }

    return res.status(201).json({
      message: "User account created successfully",
      success: true,
      status: 201,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      message: error.message || "Error registering user",
      success: false,
      status: 500,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
        success: false,
        status: 400,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found with this email",
        success: false,
        status: 404,
      });
    }

    if (!user.IsVerfied) {
      return res.status(403).json({
        message: "Please verify your email address before logging in",
        success: false,
        status: 403,
      });
    }

    const isValidPassword = await user.isPasswordCorrect(password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: "Invalid credentials",
        success: false,
        status: 401,
      });
    }

    const refreshToken = user.generateRefreshToken();

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000, 
      path:"/"
    };

    return res.cookie("token", refreshToken, cookieOptions).status(200).json({
      message: "Login successful",
      success: true,
      status: 200,
      token: refreshToken 
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: error.message || "Authentication failed",
      success: false,
      status: 500,
    });
  }
};

const sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
        success: false,
        status: 400,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found with this email",
        success: false,
        status: 404,
      });
    }

    if (user.IsVerfied) {
      return res.status(400).json({
        message: "Email is already verified",
        success: false,
        status: 400,
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); 

    user.verficationCode = code;
    user.verficationCodeExpires = expiry;
    await user.save();

    await sendVerifyEmail(email, code);

    return res.status(200).json({
      message: "Verification code sent successfully",
      success: true,
      status: 200,
    });
  } catch (error) {
    console.error("Error sending verification code:", error);
    return res.status(500).json({
      message: error.message || "Failed to send verification code",
      success: false,
      status: 500,
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        message: "Email and verification code are required",
        success: false,
        status: 400,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found with this email",
        success: false,
        status: 404,
      });
    }

    if (user.IsVerfied) {
      return res.status(400).json({
        message: "Email is already verified",
        success: false,
        status: 400,
      });
    }

    if (!user.verficationCode || new Date() > user.verficationCodeExpires) {
      return res.status(400).json({
        message: "Verification code has expired",
        success: false,
        status: 400,
      });
    }

    if (user.verficationCode !== code) {
      return res.status(401).json({
        message: "Invalid verification code",
        success: false,
        status: 401,
      });
    }

    user.IsVerfied = true;
    user.verficationCode = "";
    user.verficationCodeExpires = null;
    await user.save();

    return res.status(200).json({
      message: "Email verified successfully",
      success: true,
      status: 200,
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({
      message: error.message || "Email verification failed",
      success: false,
      status: 500,
    });
  }
};

const logout = async (req, res) => {
  try {
    const _id = req.user._id;
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path:"/"
    };

    return res.clearCookie("token", cookieOptions).status(200).json({
      message: "Logged out successfully",
      success: true,
      status: 200,
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      message: "Logout failed",
      success: false,
      status: 500,
    });
  }
};

const getcurrentUser = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(404).json({
        message: "unauthorized",
        success: false,
        status: 404,
      });
    }
    const user = await User.findById(userId).select(
      "-password -verficationCode -verficationCodeExpires"
    );
    if (!user) {
      return res.status(404).json({
        message: "User not found with this email",
        success: false,
        status: 404,
      });
    }

    return res.status(200).json({
      message: "user is found successfully",
      success: true,
      status: 200,
      user: user,
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      message: "Logout failed",
      success: false,
      status: 500,
    });
  }
};

const determineDocumentType = (filename) => {
  const lowerFilename = filename.toLowerCase();
  
  if (lowerFilename.includes('aadhaar') || lowerFilename.includes('aadhar')) {
    return 'aadhaar';
  } else if (lowerFilename.includes('pan')) {
    return 'pan';
  } else if (lowerFilename.includes('license') || lowerFilename.includes('dl')) {
    return 'driving_license';
  } else if (lowerFilename.includes('passport')) {
    return 'passport';
  } else if (lowerFilename.includes('voter')) {
    return 'voter_id';
  } else {
    return 'government_id';
  }
};

 const uploadVerificationDocuments = async (req, res) => {
  try {
    const files = req.files;
    const userId = req.user._id;

    if (!files || files.length === 0) {
      return res.status(400).json({
        message: "No files uploaded. Please select at least one document.",
        success: false,
        status: 400,
      });
    }

    const existingRequest = await VerificationRequest.findOne({
      userId: userId,
      status: 'pending'
    });

    if (existingRequest) {
      for (const file of files) {
        try {
          await cloudinary.uploader.destroy(file.filename);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }
      
      return res.status(400).json({
        message: "You already have a pending verification request. Please wait for review.",
        success: false,
        status: 400,
      });
    }

    const processedDocuments = files.map(file => ({
      documentType: determineDocumentType(file.originalname),
      documentUrl: file.path,
      publicId: file.filename,
      originalName: file.originalname,
      fileSize: file.size,
      uploadedAt: new Date()
    }));

    const verificationRequest = new VerificationRequest({
      userId: userId,
      documents: processedDocuments,
      status: 'pending',
      submittedAt: new Date()
    });

    await verificationRequest.save();

    await User.findByIdAndUpdate(userId, {
      verificationStatus: 'pending',
    });

    return res.status(200).json({
      message: "Documents uploaded successfully! Your verification request has been submitted.",
      success: true,
      status: 200,
      data: {
        requestId: verificationRequest._id,
        documentsUploaded: files.length,
        documentTypes: processedDocuments.map(doc => doc.documentType),
        status: 'pending',
        estimatedReviewTime: '24-48 hours'
      },
    });

  } catch (error) {
    console.error('Upload error:', error);

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          if (file.filename) {
            await cloudinary.uploader.destroy(file.filename);
          }
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
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

const getVerificationDocuments = async (req, res) => {
  try {
    const userId = req.user._id;

    const existingDocuments = await VerificationRequest.find({ userId });

    return res.status(200).json({
      message: "Documents retrieved successfully!",
      success: true,
      status: 200,
      data: existingDocuments || []
    });

  } catch (error) {
    console.error('Retrieval error:', error);
    return res.status(500).json({
      message: error.message || "An error occurred while retrieving documents",
      success: false,
      status: 500,
    });
  }
};


export {
  registerUser,
  loginUser,
  sendVerificationCode,
  verifyEmail,
  logout,
  getcurrentUser,
  uploadVerificationDocuments,
 getVerificationDocuments 
};
