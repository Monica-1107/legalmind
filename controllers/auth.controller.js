const User = require("../models/User.model")
const ErrorResponse = require("../utils/errorResponse")
const { cloudinary } = require("../utils/fileUpload")
const crypto = require("crypto")
const sendEmail = require("../utils/sendEmail")

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password, role, phoneNumber } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return next(new ErrorResponse("Email already registered", 400))
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      password,
      role: role || "user",
      phoneNumber,
    })

    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString("hex")
    user.resetPasswordToken = crypto.createHash("sha256").update(verificationToken).digest("hex")
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000 // 10 minutes

    await user.save({ validateBeforeSave: false })

    // Create verification URL
    const verificationUrl = `${req.protocol}://${req.get("host")}/api/auth/verify-email/${verificationToken}`

    const message = `You are receiving this email because you need to verify your email address. Please click on the link to verify: \n\n ${verificationUrl}`

    try {
      await sendEmail({
        email: user.email,
        subject: "Email Verification",
        message,
      })

      sendTokenResponse(user, 201, res)
    } catch (err) {
      console.error(err)
      user.resetPasswordToken = undefined
      user.resetPasswordExpire = undefined

      await user.save({ validateBeforeSave: false })

      return next(new ErrorResponse("Email could not be sent", 500))
    }
  } catch (err) {
    next(err)
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse("Please provide an email and password", 400))
    }

    // Check for user
    const user = await User.findOne({ email }).select("+password")

    if (!user) {
      return next(new ErrorResponse("Invalid credentials", 401))
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password)

    if (!isMatch) {
      return next(new ErrorResponse("Invalid credentials", 401))
    }

    sendTokenResponse(user, 200, res)
  } catch (err) {
    next(err)
  }
}

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    })

    res.status(200).json({
      success: true,
      data: {},
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Get current logged in user
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      fullName: req.body.fullName,
      phoneNumber: req.body.phoneNumber,
      specialization: req.body.specialization,
      barCouncilId: req.body.barCouncilId,
      yearsOfExperience: req.body.yearsOfExperience,
    }

    // Handle profile image upload if provided
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path)
      fieldsToUpdate.profileImage = result.secure_url
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex")

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    })

    if (!user) {
      return next(new ErrorResponse("Invalid token", 400))
    }

    // Set verified flag to true
    user.isVerified = true
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    })
  } catch (err) {
    next(err)
  }
}

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken()

  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
  }

  if (process.env.NODE_ENV === "production") {
    options.secure = true
  }

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    })
}

