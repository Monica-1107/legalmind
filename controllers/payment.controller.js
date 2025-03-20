const Payment = require("../models/Payment.model")
const Case = require("../models/Case.model")
const User = require("../models/User.model")
const ErrorResponse = require("../utils/errorResponse")
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

// @desc    Create payment session
// @route   POST /api/payment/create
// @access  Private
exports.createPayment = async (req, res, next) => {
  try {
    const { amount, currency, paymentMethod, serviceType, caseId } = req.body

    // Validate input
    if (!amount || !paymentMethod || !serviceType) {
      return next(new ErrorResponse("Please provide amount, payment method, and service type", 400))
    }

    // If caseId is provided, verify it exists and belongs to the user
    let caseItem = null
    if (caseId) {
      caseItem = await Case.findById(caseId)

      if (!caseItem) {
        return next(new ErrorResponse(`Case not found with id of ${caseId}`, 404))
      }

      // Make sure user owns the case
      if (caseItem.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to make payment for this case`, 403))
      }
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: currency || "usd",
      metadata: {
        userId: req.user.id,
        caseId: caseId || "none",
        serviceType,
      },
    })

    // Create payment record in database
    const payment = await Payment.create({
      user: req.user.id,
      case: caseId || null,
      amount,
      currency: currency || "USD",
      paymentMethod,
      transactionId: paymentIntent.id,
      status: "Pending",
      paymentGateway: "Stripe",
      paymentDetails: {
        clientSecret: paymentIntent.client_secret,
      },
      serviceType,
    })

    res.status(201).json({
      success: true,
      data: {
        paymentId: payment._id,
        clientSecret: paymentIntent.client_secret,
      },
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Get payment status
// @route   GET /api/payment/status/:id
// @access  Private
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)

    if (!payment) {
      return next(new ErrorResponse(`Payment not found with id of ${req.params.id}`, 404))
    }

    // Make sure user owns the payment
    if (payment.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this payment`, 403))
    }

    // If payment is still pending, check with Stripe for latest status
    if (payment.status === "Pending") {
      const paymentIntent = await stripe.paymentIntents.retrieve(payment.transactionId)

      // Update payment status based on Stripe status
      if (paymentIntent.status === "succeeded") {
        payment.status = "Completed"

        // If payment is for a case, update case payment status
        if (payment.case) {
          const caseItem = await Case.findById(payment.case)
          if (caseItem) {
            caseItem.paymentStatus = "Completed"
            await caseItem.save()
          }
        }
      } else if (paymentIntent.status === "canceled") {
        payment.status = "Failed"
      }

      await payment.save()
    }

    res.status(200).json({
      success: true,
      data: payment,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Get user payments
// @route   GET /api/payment/user
// @access  Private
exports.getUserPayments = async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1
    const limit = Number.parseInt(req.query.limit, 10) || 10
    const startIndex = (page - 1) * limit
    const endIndex = page * limit

    // Get payments for the logged-in user
    const query = { user: req.user.id }

    // Apply filters if provided
    if (req.query.status) {
      query.status = req.query.status
    }

    if (req.query.serviceType) {
      query.serviceType = req.query.serviceType
    }

    const total = await Payment.countDocuments(query)
    const payments = await Payment.find(query).sort({ createdAt: -1 }).skip(startIndex).limit(limit)

    // Pagination result
    const pagination = {}

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      }
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      }
    }

    res.status(200).json({
      success: true,
      count: payments.length,
      pagination,
      data: payments,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Process webhook from Stripe
// @route   POST /api/payment/webhook
// @access  Public
exports.stripeWebhook = async (req, res, next) => {
  const signature = req.headers["stripe-signature"]

  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object

      // Update payment status in database
      await handleSuccessfulPayment(paymentIntent)
      break

    case "payment_intent.payment_failed":
      const failedPaymentIntent = event.data.object

      // Update payment status in database
      await handleFailedPayment(failedPaymentIntent)
      break

    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true })
}

// Helper function to handle successful payment
const handleSuccessfulPayment = async (paymentIntent) => {
  try {
    // Find payment by transaction ID
    const payment = await Payment.findOne({ transactionId: paymentIntent.id })

    if (payment) {
      payment.status = "Completed"
      payment.paymentDetails = {
        ...payment.paymentDetails,
        stripeResponse: paymentIntent,
      }

      await payment.save()

      // If payment is for a case, update case payment status
      if (payment.case) {
        const caseItem = await Case.findById(payment.case)
        if (caseItem) {
          caseItem.paymentStatus = "Completed"
          await caseItem.save()
        }
      }
    }
  } catch (err) {
    console.error("Error handling successful payment:", err)
  }
}

// Helper function to handle failed payment
const handleFailedPayment = async (paymentIntent) => {
  try {
    // Find payment by transaction ID
    const payment = await Payment.findOne({ transactionId: paymentIntent.id })

    if (payment) {
      payment.status = "Failed"
      payment.paymentDetails = {
        ...payment.paymentDetails,
        stripeResponse: paymentIntent,
        failureMessage: paymentIntent.last_payment_error?.message || "Payment failed",
      }

      await payment.save()
    }
  } catch (err) {
    console.error("Error handling failed payment:", err)
  }
}

