"use client";

import Image from "next/image";
import Script from "next/script";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { api } from "@/lib/client/api";
import { notify } from "@/lib/client/notify";
import { formatPrice, formatTotalLength } from "@/lib/shared/format";

/**
 * Purchase flow: server creates the order (price from the database), Razorpay Checkout collects the payment,
 * then the server verifies the signature and enrolls. States: idle, processing, failed (see the design).
 */
export function PurchaseCard({ courseId, title, thumbnail, price, signedIn, canAccess, lectureCount, totalSeconds }) {
  const router = useRouter();
  const { user } = useAuth();
  const [phase, setPhase] = useState("idle"); // idle | processing | failed
  const [failure, setFailure] = useState(null); // { message, orderId, paymentId, verifyFailed }
  const checkoutReady = useRef(false);
  const settled = useRef(false);
  const isFree = price.amount === 0;

  const included = [
    "Lifetime access",
    `${lectureCount} ${lectureCount === 1 ? "lecture" : "lectures"}${totalSeconds > 0 ? `, ${formatTotalLength(totalSeconds)} of video` : ""}`,
    "Watch on any device",
  ];

  function fail(details) {
    settled.current = true;
    setFailure(details);
    setPhase("failed");
  }

  async function confirmPayment(orderId, response) {
    try {
      await api("/payments/verify", { method: "POST", body: response });
      settled.current = true;
      notify.success("You’re enrolled", "Your payment was successful.");
      router.refresh(); // the card flips to Start Course: the server now sees the enrollment
    } catch (err) {
      fail({
        message: "We received your payment but couldn’t confirm it. Please contact support with the details below.",
        orderId,
        paymentId: response.razorpay_payment_id,
        verifyFailed: true,
        detail: err.message,
      });
    }
  }

  async function onBuy() {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(`/courses/${courseId}`)}`);
      return;
    }
    setFailure(null);
    setPhase("processing");
    settled.current = false;

    try {
      const order = await api("/payments/create-order", { method: "POST", body: { courseId } });
      if (order.enrolled) {
        notify.success("You’re enrolled", "Enjoy the course.");
        router.refresh();
        return;
      }
      if (!checkoutReady.current || !window.Razorpay) {
        setPhase("idle");
        notify.error("Payment isn’t ready yet", "Checkout is still loading. Try again in a moment.");
        return;
      }

      const checkout = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "Learnly",
        description: title,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: "#b11226" },
        handler: (response) => confirmPayment(order.orderId, response),
        modal: {
          // Closing the window without paying is not a failure: just return to the buy button.
          ondismiss: () => {
            if (!settled.current) setPhase("idle");
          },
        },
      });
      checkout.on("payment.failed", (res) =>
        fail({
          message: res?.error?.description || "Your payment could not be completed. You have not been charged.",
          orderId: order.orderId,
          paymentId: res?.error?.metadata?.payment_id,
        }),
      );
      checkout.open();
    } catch (err) {
      if (err.status === 409) {
        notify.success("You’re already enrolled");
        router.refresh();
        return;
      }
      setPhase("idle");
      notify.error(isFree ? "Can’t enroll right now" : "Can’t start the payment", err.message);
    }
  }

  function copyDetails() {
    const text = [`Order ID ${failure?.orderId ?? "n/a"}`, failure?.paymentId ? `Payment ID ${failure.paymentId}` : null, `Course ${courseId}`]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard?.writeText(text).then(
      () => notify.success("Details copied", "Share them with support."),
      () => notify.error("Couldn’t copy", text),
    );
  }

  return (
    <aside aria-label="Purchase" className="flex flex-col gap-6 rounded-card bg-surface p-6 lg:sticky lg:top-24">
      {!isFree && !canAccess && (
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
          onLoad={() => {
            checkoutReady.current = true;
          }}
          onReady={() => {
            checkoutReady.current = Boolean(window.Razorpay);
          }}
        />
      )}

      <div className="relative aspect-video overflow-hidden rounded-base bg-t1">
        <Image src={thumbnail} alt={`${title} thumbnail`} fill sizes="(min-width: 1024px) 443px, 100vw" className="object-cover" />
      </div>

      {canAccess ? (
        <>
          <p className="flex items-center gap-3">
            <Badge variant="enrolled" />
            You have lifetime access
          </p>
          <ButtonLink href={`/learn/${courseId}`} size="lg" fullWidth leadingIcon="start-course">
            Start Course
          </ButtonLink>
        </>
      ) : (
        <>
          <p className="text-h1 text-ink">{formatPrice(price.amount, price.currency)}</p>

          {phase === "failed" && failure && (
            <div role="alert" className="flex flex-col gap-2 rounded-base bg-danger-tint p-4">
              <p className="flex items-center gap-2 font-semibold">
                <Icon name="error-panel" size={24} />
                {failure.verifyFailed ? "We couldn’t confirm your payment" : "Payment failed"}
              </p>
              <p>{failure.message}</p>
              {failure.orderId && <p className="break-all text-muted">Order ID {failure.orderId}</p>}
              {failure.paymentId && <p className="break-all text-muted">Payment ID {failure.paymentId}</p>}
              <div>
                <Button variant="ghost" leadingIcon="support" onClick={copyDetails}>
                  Copy order details
                </Button>
              </div>
            </div>
          )}

          {phase === "processing" ? (
            <Button size="lg" fullWidth disabled aria-live="polite" className="disabled:opacity-100">
              <Icon name="spinner" size={24} className="animate-spin" />
              Processing payment
            </Button>
          ) : (
            <Button size="lg" fullWidth onClick={onBuy} leadingIcon={phase === "failed" && !failure?.verifyFailed ? "retry-lg" : undefined}>
              {phase === "failed" && !failure?.verifyFailed ? "Try again" : isFree ? "Enroll Now" : "Buy Now"}
            </Button>
          )}

          {phase === "processing" ? (
            <p className="text-center text-muted">Please keep this page open.</p>
          ) : (
            !signedIn && <p className="text-center text-muted">Log in to {isFree ? "enroll" : "purchase"}</p>
          )}
        </>
      )}

      <ul className="flex flex-col gap-4">
        {included.map((text) => (
          <li key={text} className="flex items-center gap-3">
            <Icon name="check" size={24} />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
