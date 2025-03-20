const express = require("express")
const {
  uploadCase,
  getCases,
  getCase,
  analyzeCase,
  getCaseStatus,
  deleteCase,
} = require("../controllers/case.controller")
const { protect, authorize } = require("../middleware/auth.middleware")
const { upload } = require("../utils/fileUpload")

const router = express.Router()

// Apply protection middleware to all routes
router.use(protect)

/**
 * @swagger
 * /api/cases/upload:
 *   post:
 *     summary: Upload case documents
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - caseType
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               caseType:
 *                 type: string
 *                 enum: [Criminal, Civil, Family, Corporate, Intellectual Property, Real Estate, Tax, Labor, Constitutional, Other]
 *               isPublic:
 *                 type: boolean
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Case uploaded successfully
 *       400:
 *         description: Bad request
 */
router.post("/upload", upload.array("documents", 5), uploadCase)

/**
 * @swagger
 * /api/cases/list:
 *   get:
 *     summary: Get all cases for a user
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: caseType
 *         schema:
 *           type: string
 *         description: Filter by case type
 *     responses:
 *       200:
 *         description: List of cases retrieved successfully
 */
router.get("/list", getCases)

/**
 * @swagger
 * /api/cases/{id}:
 *   get:
 *     summary: Get single case
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Case ID
 *     responses:
 *       200:
 *         description: Case retrieved successfully
 *       404:
 *         description: Case not found
 */
router.get("/:id", getCase)

/**
 * @swagger
 * /api/cases/analyze/{id}:
 *   post:
 *     summary: Analyze case
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Case ID
 *     responses:
 *       202:
 *         description: Case analysis initiated
 *       404:
 *         description: Case not found
 */
router.post("/analyze/:id", analyzeCase)

/**
 * @swagger
 * /api/cases/status/{id}:
 *   get:
 *     summary: Get case status
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Case ID
 *     responses:
 *       200:
 *         description: Case status retrieved successfully
 *       404:
 *         description: Case not found
 */
router.get("/status/:id", getCaseStatus)

/**
 * @swagger
 * /api/cases/{id}:
 *   delete:
 *     summary: Delete case
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Case ID
 *     responses:
 *       200:
 *         description: Case deleted successfully
 *       404:
 *         description: Case not found
 */
router.delete("/:id", deleteCase)

module.exports = router

