const Feedback = require("../models/Feedback.model")
const Case = require("../models/Case.model")
const ErrorResponse = require("../utils/errorResponse")

// @desc    Submit feedback
// @route   POST /api/feedback/submit
// @access  Private
exports.submitFeedback = async (req, res, next) => {
  try {
    const { caseId, rating, comment, feedbackType, isPublic } = req.body

    // Validate input
    if (!rating || !comment) {
      return next(new ErrorResponse("Please provide rating and comment", 400))
    }

    // If caseId is provided, verify it exists and belongs to the user
    if (caseId) {
      const caseItem = await Case.findById(caseId)

      if (!caseItem) {
        return next(new ErrorResponse(`Case not found with id of ${caseId}`, 404))
      }

      // Make sure user owns the case
      if (caseItem.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to submit feedback for this case`, 403))
      }
    }

    // Create feedback
    const feedback = await Feedback.create({
      user: req.user.id,
      case: caseId || null,
      rating,
      comment,
      feedbackType: feedbackType || "Platform Experience",
      isPublic: isPublic !== undefined ? isPublic : true,
    })

    res.status(201).json({
      success: true,
      data: feedback,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Get all public feedback
// @route   GET /api/feedback/list
// @access  Public
exports.getPublicFeedback = async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1
    const limit = Number.parseInt(req.query.limit, 10) || 10
    const startIndex = (page - 1) * limit
    const endIndex = page * limit

    // Build query
    const query = { isPublic: true }

    // Apply feedbackType filter if provided
    if (req.query.feedbackType) {
      query.feedbackType = req.query.feedbackType
    }

    // Apply rating filter if provided
    if (req.query.rating) {
      query.rating = req.query.rating
    }

    const total = await Feedback.countDocuments(query)
    const feedback = await Feedback.find(query)
      .populate("user", "fullName profileImage")
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)

    // Pagination result
    const pagination = {}

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      }
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      }
    }

    res.status(200).json({
      success: true,
      count: feedback.length,
      pagination,
      data: feedback,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Get user's feedback
// @route   GET /api/feedback/user
// @access  Private
exports.getUserFeedback = async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1
    const limit = Number.parseInt(req.query.limit, 10) || 10
    const startIndex = (page - 1) * limit
    const endIndex = page * limit

    // Get feedback submitted by the logged-in user
    const query = { user: req.user.id }

    // Apply feedbackType filter if provided
    if (req.query.feedbackType) {
      query.feedbackType = req.query.feedbackType
    }

    const total = await Feedback.countDocuments(query)
    const feedback = await Feedback.find(query)
      .populate("case", "title")
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)

    // Pagination result
    const pagination = {}

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      }
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      }
    }

    res.status(200).json({
      success: true,
      count: feedback.length,
      pagination,
      data: feedback,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Update feedback
// @route   PUT /api/feedback/:id
// @access  Private
exports.updateFeedback = async (req, res, next) => {
  try {
    let feedback = await Feedback.findById(req.params.id)

    if (!feedback) {
      return next(new ErrorResponse(`Feedback not found with id of ${req.params.id}`, 404))
    }

    // Make sure user owns the feedback
    if (feedback.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this feedback`, 403))
    }

    // Update fields
    const fieldsToUpdate = {
      rating: req.body.rating || feedback.rating,
      comment: req.body.comment || feedback.comment,
      isPublic: req.body.isPublic !== undefined ? req.body.isPublic : feedback.isPublic,
    }

    feedback = await Feedback.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({
      success: true,
      data: feedback,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private
exports.deleteFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id)

    if (!feedback) {
      return next(new ErrorResponse(`Feedback not found with id of ${req.params.id}`, 404))
    }

    // Make sure user owns the feedback or is an admin
    if (feedback.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this feedback`, 403))
    }

    await feedback.remove()

    res.status(200).json({
      success: true,
      data: {},
    })
  } catch (err) {
    next(err)
  }
}

