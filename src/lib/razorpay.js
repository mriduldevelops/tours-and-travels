import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error("Razorpay environment variables are missing");
}

const razorpay =
  globalThis.razorpayInstance ||
  new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.razorpayInstance = razorpay;
}

export default razorpay;
