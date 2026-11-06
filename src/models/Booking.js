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
    autoIndex: false,
  },
);

const existingBookingModel = mongoose.models.Booking;
const existingPaymentStatus = existingBookingModel?.schema.path("paymentStatus");

if (
  existingBookingModel &&
  (existingBookingModel.schema.options.autoIndex !== false ||
    existingBookingModel.schema.path("razorpayOrderId")?.isRequired ||
    !existingPaymentStatus?.enumValues.includes("unpaid"))
) {
  mongoose.deleteModel("Booking");
}

const Booking =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

let bookingIndexesPromise;

export async function ensureBookingIndexes() {
  if (!bookingIndexesPromise) {
    bookingIndexesPromise = (async () => {
      let indexes;

      try {
        indexes = await Booking.collection.indexes();
      } catch (error) {
        if (error?.code !== 26) {
          throw error;
        }

        indexes = [];
      }

      const orderIdIndex = indexes.find((index) => {
        const keys = Object.keys(index.key || {});
        return (
          keys.length === 1 &&
          keys[0] === "razorpayOrderId" &&
          index.key.razorpayOrderId === 1
        );
      });

      if (
        orderIdIndex &&
        !(orderIdIndex.unique === true && orderIdIndex.sparse === true)
      ) {
        try {
          await Booking.collection.dropIndex(orderIdIndex.name);
        } catch (error) {
          if (error?.code !== 27) {
            throw error;
          }
        }
      }

      await Promise.all([
        Booking.collection.createIndex({ user: 1 }),
        Booking.collection.createIndex(
          { razorpayOrderId: 1 },
          { unique: true, sparse: true },
        ),
      ]);
    })();
  }

  const indexesPromise = bookingIndexesPromise;

  try {
    await indexesPromise;
  } catch (error) {
    if (bookingIndexesPromise === indexesPromise) {
      bookingIndexesPromise = null;
    }

    throw error;
  }
}

export default Booking;
