/* eslint-disable @next/next/no-img-element -- local blob previews and decorative SVG art */

// Catalog card preview used on the course form. Mirrors CourseCard but works from unsaved form values.
export function CoursePreviewCard({ title, category, creator, price, thumbnailUrl }) {
  return (
    <div className="overflow-hidden rounded-base bg-surface">
      <div className="relative aspect-video overflow-hidden bg-t1">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" className="size-full object-cover" />
        ) : (
          <>
            <img src="/brand/art-circle.svg" alt="" width={112} height={112} className="absolute left-[62%] top-[8%]" draggable={false} />
            <img src="/brand/art-hill.svg" alt="" width={416} height={162} className="absolute -left-12 top-[66%] max-w-none" draggable={false} />
            <p className="absolute left-4 top-4 text-h2 text-ink">Thumbnail</p>
          </>
        )}
      </div>
      <div className="flex flex-col gap-2 p-4">
        <p className="text-caption text-muted">{category || "Category"}</p>
        <p className="line-clamp-2 font-semibold">{title || "Your course title"}</p>
        <p className="text-small text-muted">{creator}</p>
        <p className="font-semibold">{price}</p>
      </div>
    </div>
  );
}
