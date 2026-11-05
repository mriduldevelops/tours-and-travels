import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },

    packageTitle: {
      type: String,
      required: true,
    },

    destination: {
      type: String,
      required: true,
    },

    travelDate: {
      type: Date,
      required: true,
    },

    travelers: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },

    pricePerTraveler: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    razorpayOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    paymentStatus: {
      type: String,
      enum: ["created", "pending", "unpaid", "paid", "failed", "refunded"],
      default: "created",
    },

    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      default: "Razorpay",
    },
  },
  {
    timestamps: true,
  },
);

const existingBookingModel = mongoose.models.Booking;
const existingPaymentStatus = existingBookingModel?.schema.path("paymentStatus");

if (
  existingBookingModel &&
  (existingBookingModel.schema.path("razorpayOrderId")?.isRequired ||
    !existingPaymentStatus?.enumValues.includes("unpaid"))
) {
  mongoose.deleteModel("Booking");
}

const Booking =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

export default Booking;
