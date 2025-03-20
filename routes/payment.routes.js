const express = require("express")
const { createPayment, getPaymentStatus, getUserPayments, stripeWebhook } = require("../controllers/payment.controller")
const { protect } = require("../middleware/auth.middleware")

const router = express.Router()

// Stripe webhook route - needs raw body
router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook)

// Apply protection middleware to all other routes
router.use(protect)

/**
 * @swagger
 * /api/payment/create:
 *   post:
 *     summary: Create payment session
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethod
 *               - serviceType
 *             properties:
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: USD
 *               paymentMethod:
 *                 type: string
 *                 enum: [Credit Card, Debit Card, UPI, Net Banking, Wallet]
 *               serviceType:
 *                 type: string
 *                 enum: [Case Analysis, Legal Consultation, Document Preparation, Subscription, Other]
 *               caseId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment session created successfully
 *       400:
 *         description: Bad request
 */
router.post("/create", createPayment)

/**
 * @swagger
 * /api/payment/status/{id}:
 *   get:
 *     summary: Get payment status
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *       404:
 *         description: Payment not found
 */
router.get("/status/:id", getPaymentStatus)

/**
 * @swagger
 * /api/payment/user:
 *   get:
 *     summary: Get user payments
 *     tags: [Payment]
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
 *         name: serviceType
 *         schema:
 *           type: string
 *         description: Filter by service type
 *     responses:
 *       200:
 *         description: User payments retrieved successfully
 */
router.get("/user", getUserPayments)

module.exports = router

