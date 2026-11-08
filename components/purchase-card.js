"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { formatPrice, formatTotalLength } from "@/lib/shared/format";

// Placeholder purchase flow: replaced by the real Razorpay checkout in Prompt 9.
export function PurchaseCard({ courseId, title, thumbnail, price, signedIn, canAccess, lectureCount, totalSeconds }) {
  const router = useRouter();
  const isFree = price.amount === 0;

  function onClick() {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(`/courses/${courseId}`)}`);
      return;
    }
    toast.info("Checkout is coming in the payments step.");
  }

  const included = [
    "Lifetime access",
    `${lectureCount} ${lectureCount === 1 ? "lecture" : "lectures"}${totalSeconds > 0 ? `, ${formatTotalLength(totalSeconds)} of video` : ""}`,
    "Watch on any device",
  ];

  return (
    <aside aria-label="Purchase" className="flex flex-col gap-6 rounded-card bg-surface p-6 lg:sticky lg:top-24">
      <div className="relative aspect-video overflow-hidden rounded-base bg-t1">
        <Image src={thumbnail} alt={`${title} thumbnail`} fill sizes="(min-width: 1024px) 443px, 100vw" className="object-cover" />
      </div>
      <p className="text-h1 text-ink">{formatPrice(price.amount, price.currency)}</p>

      {canAccess ? (
        <ButtonLink href={`/learn/${courseId}`} size="lg" fullWidth>
          Start Course
        </ButtonLink>
      ) : (
        <Button size="lg" fullWidth onClick={onClick}>
          {isFree ? "Enroll Now" : "Buy Now"}
        </Button>
      )}
      {!signedIn && !canAccess && <p className="text-center text-muted">Log in to {isFree ? "enroll" : "purchase"}</p>}

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
