const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const morgan = require("morgan")
const swaggerUi = require("swagger-ui-express")
const swaggerJsDoc = require("swagger-jsdoc")
const dotenv = require("dotenv")
const path = require("path")

// Load environment variables
dotenv.config()

// Import routes
const authRoutes = require("./routes/auth.routes")
const caseRoutes = require("./routes/case.routes")
const searchRoutes = require("./routes/search.routes")
const knowledgeGraphRoutes = require("./routes/knowledgeGraph.routes")
const paymentRoutes = require("./routes/payment.routes")
const feedbackRoutes = require("./routes/feedback.routes")

// Initialize Express app
const app = express()

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LegalMind API",
      version: "1.0.0",
      description: "API documentation for LegalMind platform",
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:5000",
      },
    ],
  },
  apis: ["./routes/*.js"],
}

const swaggerDocs = swaggerJsDoc(swaggerOptions)

// Middleware
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))
app.use(cors())
app.use(helmet())
app.use(morgan("dev"))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
})

// Apply rate limiting to authentication routes
app.use("/api/auth", limiter)

// API routes
app.use("/api/auth", authRoutes)
app.use("/api/cases", caseRoutes)
app.use("/api/search", searchRoutes)
app.use("/api/knowledge-graph", knowledgeGraphRoutes)
app.use("/api/payment", paymentRoutes)
app.use("/api/feedback", feedbackRoutes)

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs))

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  })
})

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB")

    // Start server
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err)
    process.exit(1)
  })

module.exports = app

