const mongoose = require("mongoose")

const KnowledgeGraphSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a title for the knowledge graph"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    nodes: [
      {
        id: {
          type: String,
          required: true,
        },
        label: {
          type: String,
          required: true,
        },
        group: {
          type: String,
          required: true,
        },
        description: String,
        size: {
          type: Number,
          default: 10,
        },
      },
    ],
    edges: [
      {
        source: {
          type: String,
          required: true,
        },
        target: {
          type: String,
          required: true,
        },
        label: String,
        weight: {
          type: Number,
          default: 1,
        },
      },
    ],
    category: {
      type: String,
      enum: ["Legal Concept", "Case Analysis", "Statute Relationship", "Custom"],
      default: "Legal Concept",
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    relatedCase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("KnowledgeGraph", KnowledgeGraphSchema)

