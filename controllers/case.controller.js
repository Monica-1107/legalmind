const Case = require("../models/Case.model")
const ErrorResponse = require("../utils/errorResponse")
const { cloudinary } = require("../utils/fileUpload")
const axios = require("axios")
const redis = require("../config/redis")

// @desc    Upload case documents
// @route   POST /api/cases/upload
// @access  Private
exports.uploadCase = async (req, res, next) => {
  try {
    const { title, description, caseType, isPublic } = req.body

    // Create case
    const newCase = await Case.create({
      title,
      description,
      caseType,
      isPublic: isPublic || false,
      user: req.user.id,
      documents: [],
    })

    // Process uploaded files
    if (req.files && req.files.length > 0) {
      const documents = []

      for (const file of req.files) {
        documents.push({
          name: file.originalname,
          fileUrl: file.path,
          fileType: file.mimetype,
        })
      }

      newCase.documents = documents
      await newCase.save()
    }

    res.status(201).json({
      success: true,
      data: newCase,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Get all cases for a user
// @route   GET /api/cases/list
// @access  Private
exports.getCases = async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1
    const limit = Number.parseInt(req.query.limit, 10) || 10
    const startIndex = (page - 1) * limit
    const endIndex = page * limit

    // Get cases for the logged-in user
    const query = { user: req.user.id }

    // Apply filters if provided
    if (req.query.status) {
      query.status = req.query.status
    }

    if (req.query.caseType) {
      query.caseType = req.query.caseType
    }

    const total = await Case.countDocuments(query)
    const cases = await Case.find(query).sort({ createdAt: -1 }).skip(startIndex).limit(limit)

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
      count: cases.length,
      pagination,
      data: cases,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Get single case
// @route   GET /api/cases/:id
// @access  Private
exports.getCase = async (req, res, next) => {
  try {
    const caseItem = await Case.findById(req.params.id)

    if (!caseItem) {
      return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404))
    }

    // Make sure user owns the case or is an admin
    if (caseItem.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this case`, 403))
    }

    res.status(200).json({
      success: true,
      data: caseItem,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Analyze case
// @route   POST /api/cases/analyze/:id
// @access  Private
exports.analyzeCase = async (req, res, next) => {
  try {
    const caseItem = await Case.findById(req.params.id)

    if (!caseItem) {
      return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404))
    }

    // Make sure user owns the case or is an admin
    if (caseItem.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to analyze this case`, 403))
    }

    // Update case status to Processing
    caseItem.status = "Processing"
    await caseItem.save()

    // Send case to NLP microservice for analysis
    // This would be an async operation in a real-world scenario
    try {
      // Simulate NLP analysis with a delay
      setTimeout(async () => {
        try {
          // Simulated analysis results
          const analysisResults = {
            summary: `This is an automated summary of the case "${caseItem.title}". The case involves ${caseItem.description.substring(0, 100)}...`,
            relevantLaws: [
              {
                name: "Section 420 IPC",
                description: "Cheating and dishonestly inducing delivery of property",
                relevance: 0.85,
              },
              {
                name: "Article 21",
                description: "Protection of life and personal liberty",
                relevance: 0.72,
              },
            ],
            similarCases: [
              {
                caseId: "60a1b2c3d4e5f6g7h8i9j0k1",
                title: "Smith vs. State",
                similarity: 0.78,
              },
            ],
            judgmentPrediction: {
              outcome: "Favorable",
              confidence: 0.65,
            },
            tags: ["Criminal", "Fraud", "Property"],
          }

          // Update case with analysis results
          caseItem.analysisResults = analysisResults
          caseItem.status = "Analyzed"
          await caseItem.save()

          console.log(`Case ${caseItem._id} analyzed successfully`)
        } catch (error) {
          console.error(`Error in NLP analysis: ${error.message}`)
          caseItem.status = "Failed"
          await caseItem.save()
        }
      }, 5000) // Simulate 5-second processing time

      res.status(202).json({
        success: true,
        message: "Case analysis initiated",
        data: {
          caseId: caseItem._id,
          status: caseItem.status,
        },
      })
    } catch (error) {
      caseItem.status = "Failed"
      await caseItem.save()
      return next(new ErrorResponse("Error initiating case analysis", 500))
    }
  } catch (err) {
    next(err)
  }
}

// @desc    Get case status
// @route   GET /api/cases/status/:id
// @access  Private
exports.getCaseStatus = async (req, res, next) => {
  try {
    const caseItem = await Case.findById(req.params.id)

    if (!caseItem) {
      return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404))
    }

    // Make sure user owns the case or is an admin
    if (caseItem.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this case`, 403))
    }

    res.status(200).json({
      success: true,
      data: {
        caseId: caseItem._id,
        status: caseItem.status,
        lastUpdated: caseItem.updatedAt,
      },
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Delete case
// @route   DELETE /api/cases/:id
// @access  Private
exports.deleteCase = async (req, res, next) => {
  try {
    const caseItem = await Case.findById(req.params.id)

    if (!caseItem) {
      return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404))
    }

    // Make sure user owns the case or is an admin
    if (caseItem.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this case`, 403))
    }

    // Delete documents from Cloudinary if they exist
    if (caseItem.documents && caseItem.documents.length > 0) {
      for (const doc of caseItem.documents) {
        if (doc.fileUrl) {
          const publicId = doc.fileUrl.split("/").pop().split(".")[0]
          await cloudinary.uploader.destroy(`legalmind/${publicId}`)
        }
      }
    }

    await caseItem.remove()

    res.status(200).json({
      success: true,
      data: {},
    })
  } catch (err) {
    next(err)
  }
}

