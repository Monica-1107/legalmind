const mongoose = require("mongoose")

const CaseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a case title"],
      trim: true,
      maxlength: [200, "Title cannot be more than 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Please provide a case description"],
    },
    caseType: {
      type: String,
      required: [true, "Please specify the case type"],
      enum: [
        "Criminal",
        "Civil",
        "Family",
        "Corporate",
        "Intellectual Property",
        "Real Estate",
        "Tax",
        "Labor",
        "Constitutional",
        "Other",
      ],
    },
    documents: [
      {
        name: String,
        fileUrl: String,
        fileType: String,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Submitted", "Processing", "Analyzed", "Completed", "Failed"],
      default: "Submitted",
    },
    analysisResults: {
      summary: String,
      relevantLaws: [
        {
          name: String,
          description: String,
          relevance: Number,
        },
      ],
      similarCases: [
        {
          caseId: String,
          title: String,
          similarity: Number,
        },
      ],
      judgmentPrediction: {
        outcome: String,
        confidence: Number,
      },
      tags: [String],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    assignedLawyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Refunded", "Free"],
      default: "Free",
    },
  },
  { timestamps: true },
)

// Create text index for search functionality
CaseSchema.index(
  { title: "text", description: "text", "analysisResults.summary": "text" },
  { weights: { title: 3, description: 2, "analysisResults.summary": 1 } },
)

module.exports = mongoose.model("Case", CaseSchema)

