"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatPrice } from "@/lib/shared/format";

// Placeholder purchase flow: replaced by the real Razorpay checkout in Prompt 9.
export function PurchaseCard({ courseId, price, signedIn, canAccess, lectureCount }) {
  const router = useRouter();
  const isFree = price.amount === 0;

  function onClick() {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(`/courses/${courseId}`)}`);
      return;
    }
    toast.info("Checkout is coming in the payments step.");
  }

  return (
    <aside className="rounded-base bg-surface p-6 lg:sticky lg:top-24 lg:self-start">
      <p className="text-4xl font-bold tracking-tight">{formatPrice(price.amount, price.currency)}</p>
      <p className="mt-1 text-small text-muted">
        {lectureCount} {lectureCount === 1 ? "lecture" : "lectures"}
      </p>
      {canAccess ? (
        <Link
          href={`/learn/${courseId}`}
          className="mt-6 block rounded-base bg-accent px-4 py-3 text-center font-medium text-accent-ink transition-colors hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-t5"
        >
          Start Course
        </Link>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className="mt-6 w-full rounded-base bg-accent px-4 py-3 font-medium text-accent-ink transition-colors hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-t5"
        >
          {isFree ? "Enroll Now" : "Buy Now"}
        </button>
      )}
    </aside>
  );
}
