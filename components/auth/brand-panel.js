// Decorative right-hand panel on login/register. The sample cards are illustrative, not real listings.
const SAMPLES = [
  { category: "Web Development", creator: "Rahul Verma", price: "₹1,499", label: "React", title: "React for Beginners: Build Five Real Projects" },
  { category: "Data Science", creator: "Ananya Iyer", price: "₹1,799", label: "Python", title: "Python for Data Analysis, from Scratch" },
  { category: "Design", creator: "Karan Mehta", price: "₹999", label: "Figma", title: "UI Design Fundamentals in Figma" },
  { category: "Marketing", creator: "Sneha Kulkarni", price: "₹1,199", label: "Ads", title: "Digital Marketing: Your First Campaign" },
  { category: "Cloud & DevOps", creator: "Dev Malhotra", price: "₹1,299", label: "AWS", title: "Cloud Basics: Ship Your First Service" },
];

function SampleCard({ sample }) {
  return (
    <div className="w-[320px] overflow-hidden rounded-base bg-surface">
      <div className="relative h-[180px] overflow-hidden bg-t1">
        {/* eslint-disable @next/next/no-img-element -- decorative SVG art exported from Figma */}
        <img src="/brand/art-circle.svg" alt="" width={112} height={112} className="absolute left-[198px] top-[14px]" draggable={false} />
        <img src="/brand/art-hill.svg" alt="" width={416} height={162} className="absolute -left-12 top-[119px]" draggable={false} />
        {/* eslint-enable @next/next/no-img-element */}
        <p className="absolute left-4 top-4 text-h2 text-ink">{sample.label}</p>
      </div>
      <div className="flex flex-col gap-2 p-4">
        <p className="text-caption text-muted">{sample.category}</p>
        <p className="font-semibold">{sample.title}</p>
        <p className="text-small text-muted">{sample.creator}</p>
        <p className="font-semibold">{sample.price}</p>
      </div>
    </div>
  );
}

export function BrandPanel({ heading, count = 4 }) {
  const items = SAMPLES.slice(0, count);
  const left = items.filter((_, i) => i % 2 === 0);
  const right = items.filter((_, i) => i % 2 === 1);
  return (
    <div aria-hidden="true" className="relative h-full overflow-hidden rounded-card bg-t1 p-12">
      <p className="max-w-[560px] text-h2 text-ink">{heading}</p>
      <div className="mt-[56px] flex gap-6">
        <div className="flex flex-col gap-8">
          {left.map((s) => (
            <SampleCard key={s.title} sample={s} />
          ))}
        </div>
        <div className="mt-32 flex flex-col gap-8">
          {right.map((s) => (
            <SampleCard key={s.title} sample={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
