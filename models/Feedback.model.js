const mongoose = require("mongoose")

const FeedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
    },
    rating: {
      type: Number,
      required: [true, "Please provide a rating"],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, "Please provide feedback comment"],
      trim: true,
    },
    feedbackType: {
      type: String,
      enum: ["Case Analysis", "Legal Advice", "Platform Experience", "Other"],
      default: "Platform Experience",
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Feedback", FeedbackSchema)

