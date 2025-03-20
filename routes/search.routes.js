const express = require("express")
const { searchLaws, searchCases, getSimilarCases } = require("../controllers/search.controller")
const { protect } = require("../middleware/auth.middleware")

const router = express.Router()

/**
 * @swagger
 * /api/search/laws:
 *   get:
 *     summary: Search laws
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
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
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         description: Bad request
 */
router.get("/laws", searchLaws)

/**
 * @swagger
 * /api/search/cases:
 *   get:
 *     summary: Search cases
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
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
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         description: Bad request
 */
router.get("/cases", protect, searchCases)

/**
 * @swagger
 * /api/search/similar/{id}:
 *   get:
 *     summary: Get similar cases
 *     tags: [Search]
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
 *         description: Similar cases retrieved successfully
 *       404:
 *         description: Case not found
 */
router.get("/similar/:id", protect, getSimilarCases)

module.exports = router

