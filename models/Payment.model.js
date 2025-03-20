const mongoose = require("mongoose")

const PaymentSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: [true, "Please specify the payment amount"],
    },
    currency: {
      type: String,
      required: [true, "Please specify the currency"],
      default: "USD",
    },
    paymentMethod: {
      type: String,
      required: [true, "Please specify the payment method"],
      enum: ["Credit Card", "Debit Card", "UPI", "Net Banking", "Wallet"],
    },
    transactionId: {
      type: String,
      required: [true, "Transaction ID is required"],
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Refunded"],
      default: "Pending",
    },
    paymentGateway: {
      type: String,
      enum: ["Stripe", "Razorpay", "PayPal"],
      required: true,
    },
    paymentDetails: {
      type: Object,
    },
    serviceType: {
      type: String,
      enum: ["Case Analysis", "Legal Consultation", "Document Preparation", "Subscription", "Other"],
      required: true,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Payment", PaymentSchema)

