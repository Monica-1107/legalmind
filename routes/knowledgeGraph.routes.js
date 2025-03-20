const express = require("express")
const {
  generateKnowledgeGraph,
  getKnowledgeGraph,
  getPublicKnowledgeGraphs,
  getUserKnowledgeGraphs,
  updateKnowledgeGraph,
  deleteKnowledgeGraph,
} = require("../controllers/knowledgeGraph.controller")
const { protect } = require("../middleware/auth.middleware")

const router = express.Router()

/**
 * @swagger
 * /api/knowledge-graph/generate:
 *   post:
 *     summary: Generate knowledge graph
 *     tags: [Knowledge Graph]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [Legal Concept, Case Analysis, Statute Relationship, Custom]
 *               caseId:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Knowledge graph generated successfully
 *       400:
 *         description: Bad request
 */
router.post("/generate", protect, generateKnowledgeGraph)

/**
 * @swagger
 * /api/knowledge-graph/{id}:
 *   get:
 *     summary: Get knowledge graph
 *     tags: [Knowledge Graph]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Knowledge graph ID
 *     responses:
 *       200:
 *         description: Knowledge graph retrieved successfully
 *       404:
 *         description: Knowledge graph not found
 */
router.get("/:id", getKnowledgeGraph)

/**
 * @swagger
 * /api/knowledge-graph:
 *   get:
 *     summary: Get all public knowledge graphs
 *     tags: [Knowledge Graph]
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
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: Knowledge graphs retrieved successfully
 */
router.get("/", getPublicKnowledgeGraphs)

/**
 * @swagger
 * /api/knowledge-graph/user:
 *   get:
 *     summary: Get user's knowledge graphs
 *     tags: [Knowledge Graph]
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
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: Knowledge graphs retrieved successfully
 */
router.get("/user", protect, getUserKnowledgeGraphs)

/**
 * @swagger
 * /api/knowledge-graph/{id}:
 *   put:
 *     summary: Update knowledge graph
 *     tags: [Knowledge Graph]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Knowledge graph ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               nodes:
 *                 type: array
 *                 items:
 *                   type: object
 *               edges:
 *                 type: array
 *                 items:
 *                   type: object
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Knowledge graph updated successfully
 *       404:
 *         description: Knowledge graph not found
 */
router.put("/:id", protect, updateKnowledgeGraph)

/**
 * @swagger
 * /api/knowledge-graph/{id}:
 *   delete:
 *     summary: Delete knowledge graph
 *     tags: [Knowledge Graph]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Knowledge graph ID
 *     responses:
 *       200:
 *         description: Knowledge graph deleted successfully
 *       404:
 *         description: Knowledge graph not found
 */
router.delete("/:id", protect, deleteKnowledgeGraph)

module.exports = router

