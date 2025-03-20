const cloudinary = require("cloudinary").v2
const { CloudinaryStorage } = require("multer-storage-cloudinary")
const multer = require("multer")
const path = require("path")

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Set up storage engine for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "legalmind",
    allowed_formats: ["jpg", "jpeg", "png", "pdf", "doc", "docx", "txt"],
    resource_type: "auto",
  },
})

// Initialize multer upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allowed extensions
    const filetypes = /jpeg|jpg|png|pdf|doc|docx|txt/
    // Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    // Check mime type
    const mimetype = filetypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Error: File type not supported!"))
    }
  },
})

module.exports = { upload, cloudinary }

