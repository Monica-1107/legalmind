const express = require("express")
const {
  submitFeedback,
  getPublicFeedback,
  getUserFeedback,
  updateFeedback,
  deleteFeedback,
} = require("../controllers/feedback.controller")
const { protect } = require("../middleware/auth.middleware")

const router = express.Router()

/**
 * @swagger
 * /api/feedback/submit:
 *   post:
 *     summary: Submit feedback
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - comment
 *             properties:
 *               caseId:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *               feedbackType:
 *                 type: string
 *                 enum: [Case Analysis, Legal Advice, Platform Experience, Other]
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *       400:
 *         description: Bad request
 */
router.post("/submit", protect, submitFeedback)

/**
 * @swagger
 * /api/feedback/list:
 *   get:
 *     summary: Get all public feedback
 *     tags: [Feedback]
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
 *         name: feedbackType
 *         schema:
 *           type: string
 *         description: Filter by feedback type
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *         description: Filter by rating
 *     responses:
 *       200:
 *         description: Feedback retrieved successfully
 */
router.get("/list", getPublicFeedback)

/**
 * @swagger
 * /api/feedback/user:
 *   get:
 *     summary: Get user's feedback
 *     tags: [Feedback]
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
 *         name: feedbackType
 *         schema:
 *           type: string
 *         description: Filter by feedback type
 *     responses:
 *       200:
 *         description: User feedback retrieved successfully
 */
router.get("/user", protect, getUserFeedback)

/**
 * @swagger
 * /api/feedback/{id}:
 *   put:
 *     summary: Update feedback
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Feedback ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Feedback updated successfully
 *       404:
 *         description: Feedback not found
 */
router.put("/:id", protect, updateFeedback)

/**
 * @swagger
 * /api/feedback/{id}:
 *   delete:
 *     summary: Delete feedback
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Feedback ID
 *     responses:
 *       200:
 *         description: Feedback deleted successfully
 *       404:
 *         description: Feedback not found
 */
router.delete("/:id", protect, deleteFeedback)

module.exports = router

