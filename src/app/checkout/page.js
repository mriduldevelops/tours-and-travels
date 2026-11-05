"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import TravelLoader from "@/components/TravelLoader";
import styles from "./Checkout.module.css";
import { isValidFutureTripDate } from "@/lib/trip-date";

const formatTripDate = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const packageId = searchParams.get("packageId");
  const initialTravelers = Number(searchParams.get("travelers") || 1);

  const [travelPackage, setTravelPackage] = useState(null);
  const [travelers, setTravelers] = useState(
    Number.isInteger(initialTravelers) &&
      initialTravelers >= 1 &&
      initialTravelers <= 20
      ? initialTravelers
      : 1,
  );

  const [loadingPackage, setLoadingPackage] = useState(true);
  const [paying, setPaying] = useState(false);
  const [bookingLater, setBookingLater] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  useEffect(() => {
    if (!packageId) {
      setMessage("Package ID is missing");
      setLoadingPackage(false);
      return;
    }

    async function loadPackage() {
      try {
        const response = await fetch(`/api/packages/${packageId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Package not found");
        }

        setTravelPackage(data.package);
      } catch (error) {
        setMessage(error.message);
      } finally {
        setLoadingPackage(false);
      }
    }

    loadPackage();
  }, [packageId]);

  const totalAmount =
    Number(travelPackage?.price || 0) * Number(travelers || 1);

  function showMessage(text, type = "error") {
    setMessage(text);
    setMessageType(type);
  }

  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  }

  async function handlePayment() {
    setMessage("");

    if (!travelPackage || !packageId) {
      showMessage("Package details are missing");
      return;
    }

    if (!isValidFutureTripDate(travelPackage.tripDate)) {
      showMessage("This package does not have an upcoming trip date.");
      return;
    }

    if (
      !Number.isInteger(Number(travelers)) ||
      travelers < 1 ||
      travelers > 20
    ) {
      showMessage("Please select between 1 and 20 travelers");
      return;
    }

    setPaying(true);

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay Checkout");
      }

      const orderResponse = await fetch("/api/bookings/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageId,
          travelers: Number(travelers),
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        if (orderResponse.status === 401) {
          router.push(
            `/login?next=${encodeURIComponent(
              `/checkout?packageId=${packageId}&travelers=${travelers}`,
            )}`,
          );
          return;
        }

        throw new Error(orderData.message || "Unable to create payment order");
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Manchale Travelers",
        description: orderData.packageTitle,
        order_id: orderData.orderId,

        handler: async function (response) {
          try {
            showMessage("Verifying payment...", "success");

            const verifyResponse = await fetch("/api/bookings/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                bookingId: orderData.bookingId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.paymentStatus === "paid") {
              router.push(`/booking-success?bookingId=${orderData.bookingId}`);
              return;
            }

            if (verifyResponse.status === 202) {
              showMessage(
                "Payment is authorized and awaiting capture. Your booking is pending.",
                "success",
              );
              router.push(
                `/my-bookings?status=pending&bookingId=${orderData.bookingId}`,
              );
              return;
            }

            throw new Error(
              verifyData.message || "Payment verification failed",
            );
          } catch (error) {
            showMessage(
              `${error.message}. Please check My Bookings before retrying.`,
            );
          } finally {
            setPaying(false);
          }
        },

        prefill: {
          name: "",
          email: "",
          contact: "",
        },

        theme: {
          color: "#172c3c",
        },

        modal: {
          ondismiss: function () {
            setPaying(false);
            showMessage("Payment window closed. You can try again.");
          },
        },
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", function (response) {
        setPaying(false);

        showMessage(
          response.error?.description ||
            "Payment failed. Please try another payment method.",
        );
      });

      checkout.open();
    } catch (error) {
      showMessage(error.message || "Something went wrong");
      setPaying(false);
    }
  }

  async function handleBookLater() {
    setMessage("");

    if (!travelPackage || !packageId) {
      showMessage("Package details are missing");
      return;
    }

    if (!isValidFutureTripDate(travelPackage.tripDate)) {
      showMessage("This package does not have an upcoming trip date.");
      return;
    }

    if (
      !Number.isInteger(Number(travelers)) ||
      travelers < 1 ||
      travelers > 20
    ) {
      showMessage("Please select between 1 and 20 travelers");
      return;
    }

    setPaying(true);
    setBookingLater(true);

    try {
      const response = await fetch("/api/bookings/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageId,
          travelers: Number(travelers),
          paymentMode: "pay_later",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push(
            `/login?next=${encodeURIComponent(
              `/checkout?packageId=${packageId}&travelers=${travelers}`,
            )}`,
          );
          return;
        }

        throw new Error(data.message || "Unable to reserve this package");
      }

      router.push(
        `/booking-success?bookingId=${data.bookingId}&payment=deferred`,
      );
    } catch (error) {
      showMessage(error.message || "Unable to reserve this package");
      setPaying(false);
      setBookingLater(false);
    }
  }

  if (loadingPackage) {
    return (
      <div className={styles.loading}>
        <TravelLoader label="Preparing your secure checkout" />
      </div>
    );
  }

  if (!travelPackage) {
    return (
      <div className={styles.loading}>{message || "Package unavailable"}</div>
    );
  }

  return (
    <main className={styles.checkoutPage}>
      <header className={styles.header}>
        <BrandLogo />

        <div className={styles.secureText}>
          <span>♧</span> SECURE CHECKOUT
        </div>
      </header>

      <div className={styles.pageIntro}>
        <p>YOUR JOURNEY BEGINS HERE</p>
        <h1>Complete Your Booking</h1>
        <span>
          Review your travel details, then pay now or reserve your trip for
          payment later.
        </span>
      </div>

      {message && (
        <div
          className={
            messageType === "success"
              ? styles.successMessage
              : styles.errorMessage
          }
        >
          {message}
        </div>
      )}

      <section className={styles.checkoutGrid}>
        <div className={styles.detailsColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeading}>
              <span className={styles.step}>01</span>
              <div>
                <h2>Your Travel Experience</h2>
                <p>Package details</p>
              </div>
            </div>

            <div className={styles.packageInfo}>
              <div className={styles.packageImage}>
                {travelPackage.images?.[0] ? (
                  <img
                    src={travelPackage.images[0]}
                    alt={travelPackage.title}
                  />
                ) : (
                  <div className={styles.imageFallback}>✈</div>
                )}
              </div>

              <div className={styles.packageText}>
                <span className={styles.destination}>
                  {travelPackage.destination}
                </span>
                <h3>{travelPackage.title}</h3>
                <p>{travelPackage.duration}</p>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeading}>
              <span className={styles.step}>02</span>
              <div>
                <h2>Travel Details</h2>
                <p>Scheduled trip date and group size</p>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Trip Date</label>
              <p>
                {isValidFutureTripDate(travelPackage.tripDate)
                  ? formatTripDate(travelPackage.tripDate)
                  : "No upcoming trip date scheduled"}
              </p>
            </div>

            <div className={styles.formGroup}>
              <label>Number of Travelers</label>
              <select
                value={travelers}
                onChange={(e) => setTravelers(Number(e.target.value))}
              >
                {Array.from({ length: 20 }, (_, index) => index + 1).map(
                  (number) => (
                    <option key={number} value={number}>
                      {number} {number === 1 ? "Traveler" : "Travelers"}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div className={styles.paymentNote}>
            <span>♧</span>
            <div>
              <strong>Secure payment powered by Razorpay</strong>
              <p>
                Your payment is processed securely. Card information is handled
                by Razorpay Checkout.
              </p>
            </div>
          </div>
        </div>

        <aside className={styles.summaryCard}>
          <p className={styles.summaryEyebrow}>BOOKING SUMMARY</p>
          <h2>Your Trip</h2>

          <div className={styles.summaryLine}>
            <span>Price per traveler</span>
            <strong>
              ₹{Number(travelPackage.price).toLocaleString("en-IN")}
            </strong>
          </div>

          <div className={styles.summaryLine}>
            <span>Travelers</span>
            <strong>{travelers}</strong>
          </div>

          <div className={styles.summaryLine}>
            <span>Travel date</span>
            <strong>
              {isValidFutureTripDate(travelPackage.tripDate)
                ? formatTripDate(travelPackage.tripDate)
                : "No upcoming trip date scheduled"}
            </strong>
          </div>

          <div className={styles.summaryDivider} />

          <div className={styles.totalLine}>
            <span>Total Amount</span>
            <strong>₹{totalAmount.toLocaleString("en-IN")}</strong>
          </div>

          <button
            className={styles.payButton}
            onClick={handlePayment}
            disabled={paying || !isValidFutureTripDate(travelPackage.tripDate)}
          >
            {paying ? (
              <TravelLoader
                compact
                label={bookingLater ? "Reserving your trip..." : "Securing your payment..."}
              />
            ) : (
              <>
                Proceed to Payment
                <span>→</span>
              </>
            )}
          </button>

          <button
            className={styles.payLaterButton}
            onClick={handleBookLater}
            disabled={paying || !isValidFutureTripDate(travelPackage.tripDate)}
          >
            Book Now, Pay Later
            <span>→</span>
          </button>

          <p className={styles.payLaterNote}>
            Reserve your place now. The full booking amount will remain due.
          </p>

          <p className={styles.terms}>
            By continuing, you agree to the booking terms and cancellation
            policy.
          </p>

          <div className={styles.trustRow}>
            <span>♧ Secure</span>
            <span>✦ Trusted</span>
            <span>✓ Verified</span>
          </div>
        </aside>
      </section>

      <footer className={styles.footer}>
        © {new Date().getFullYear()} Manchale Travelers. Crafted for memorable
        journeys.
      </footer>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className={styles.loading}><TravelLoader label="Preparing checkout" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
