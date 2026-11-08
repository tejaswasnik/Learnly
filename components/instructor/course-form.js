"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client/api";
import { notify } from "@/lib/client/notify";
import { useAuth } from "@/components/providers";
import { CoursePreviewCard } from "@/components/instructor/course-preview-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { FilePicker } from "@/components/ui/file-picker";
import { SelectField, TextareaField } from "@/components/ui/form-fields";
import { Icon } from "@/components/ui/icon";
import { TextField } from "@/components/ui/text-field";
import { CATEGORIES, CURRENCIES } from "@/lib/shared/constants";
import { formatPrice, formatPriceExact } from "@/lib/shared/format";
import { createCourseSchema, updateCourseSchema } from "@/lib/server/validators/course";

const FIELDS = ["courseTitle", "subTitle", "description", "category", "currency", "price"];

function Section({ title, description, children }) {
  return (
    <section className="flex flex-col gap-6 rounded-card bg-surface p-6 md:p-8">
      <header className="flex flex-col gap-1">
        <h2 className="text-h3 text-ink">{title}</h2>
        <p className="text-small text-muted">{description}</p>
      </header>
      {children}
    </section>
  );
}

function firstIssues(error) {
  const out = {};
  for (const issue of error.issues) out[issue.path[0]] ??= issue.message;
  return out;
}

// One form for create and edit. `course` is the saved course when editing.
export function CourseForm({ course }) {
  const isEdit = Boolean(course);
  const router = useRouter();
  const { user } = useAuth();

  const [values, setValues] = useState({
    courseTitle: course?.courseTitle ?? "",
    subTitle: course?.subTitle ?? "",
    description: course?.description ?? "",
    category: course?.category ?? "",
    currency: course?.price.currency ?? "INR",
    price: course ? String(course.price.amount) : "",
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState("");
  const [saving, setSaving] = useState(false);

  // Editing a field clears its own error straight away; the others stay until the next submit.
  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const previewPrice = formatPriceExact(values.price, values.currency);
  const [blobUrl, setBlobUrl] = useState(null);
  const thumbnailUrl = blobUrl ?? course?.courseThumbnail ?? null;

  function pickThumbnail(file) {
    setThumbnail(file);
    setBlobUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
    setErrors((e) => ({ ...e, courseThumbnail: undefined }));
  }

  function removeThumbnail() {
    setThumbnail(null);
    setBlobUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBanner("");

    const parsed = (isEdit ? updateCourseSchema : createCourseSchema).safeParse(values);
    const found = parsed.success ? {} : firstIssues(parsed.error);
    if (!values.category) found.category = "Choose a category.";
    if (values.price.trim() === "") found.price = "Enter a price. Use 0 for a free course.";
    if (!isEdit && !thumbnail) found.courseThumbnail = "Add a thumbnail image.";
    if (Object.keys(found).length > 0) {
      setErrors(found);
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }
    setErrors({});

    const body = new FormData();
    for (const name of FIELDS) body.append(name, values[name]);
    if (thumbnail) body.append("courseThumbnail", thumbnail);

    setSaving(true);
    try {
      const data = isEdit
        ? await api(`/courses/update/${course.id}`, { method: "PATCH", body })
        : await api("/courses/create", { method: "POST", body });
      if (isEdit) {
        notify.success("Course saved");
        router.push("/instructor/dashboard");
      } else {
        notify.success("Course created", "Now add your lectures.");
        router.push(`/courses/${data.course.id}/lectures`);
      }
      router.refresh();
    } catch (err) {
      setSaving(false);
      if (err.errors) setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]])));
      else setBanner(err.status === 0 ? err.message : `We couldn’t save your course. ${err.message}`);
    }
  }

  const preview = (
    <CoursePreviewCard
      title={values.courseTitle.trim()}
      category={values.category}
      creator={user?.name ?? ""}
      price={previewPrice ? formatPrice(Number(values.price), values.currency) : "₹0"}
      thumbnailUrl={thumbnailUrl}
    />
  );

  return (
    <main className="mx-auto w-full max-w-[1440px] px-(--m) pb-24 pt-8 md:pt-12">
      <header className="flex flex-col items-start gap-4">
        <ButtonLink href="/instructor/dashboard" variant="ghost" leadingIcon="chevron-left">
          Back to dashboard
        </ButtonLink>
        <h1 className="text-h1 text-ink">{isEdit ? "Edit course" : "Create course"}</h1>
        <p className="text-muted">
          {isEdit ? "Update what learners see on the course page." : "Start with the basics. You can add lectures after saving."}
        </p>
      </header>

      {banner && (
        <p role="alert" className="mt-8 flex items-center gap-3 rounded-base bg-danger-tint px-4 py-3 font-semibold">
          <Icon name="error-banner" size={24} />
          {banner}
        </p>
      )}

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,976px)_368px]">
        <form onSubmit={onSubmit} noValidate className="flex min-w-0 flex-col gap-6">
          <Section title="Basics" description="The title and description appear on the course page and in the catalog.">
            <TextField
              id="courseTitle"
              label="Course title"
              placeholder="e.g. React for Beginners"
              helper="Make it specific. 3 to 120 characters."
              value={values.courseTitle}
              onChange={set("courseTitle")}
              error={errors.courseTitle}
              maxLength={120}
            />
            <TextField
              id="subTitle"
              label="Subtitle"
              placeholder="e.g. Build five real projects"
              helper="One line on what learners will be able to do."
              value={values.subTitle}
              onChange={set("subTitle")}
              error={errors.subTitle}
              maxLength={200}
            />
            <TextareaField
              id="description"
              label="Description"
              placeholder="What will learners build, and who is this course for?"
              helper="Shown on the course page. Up to 5,000 characters."
              value={values.description}
              onChange={set("description")}
              error={errors.description}
              maxLength={5000}
            />
          </Section>

          <Section title="Details" description="Category helps learners find the course. Price is what they pay once.">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
              <SelectField
                id="category"
                label="Category"
                helper="Pick the closest match."
                value={values.category}
                onChange={set("category")}
                error={errors.category}
                options={[{ value: "", label: "Choose a category" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
              />
              <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-4 md:grid-cols-[160px_220px]">
                <SelectField
                  id="currency"
                  label="Currency"
                  helper="INR, USD or EUR."
                  value={values.currency}
                  onChange={set("currency")}
                  error={errors.currency}
                  options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                />
                <TextField
                  id="price"
                  label="Price"
                  inputMode="decimal"
                  placeholder="0"
                  helper="Whole or two decimals."
                  value={values.price}
                  onChange={set("price")}
                  error={errors.price}
                />
              </div>
            </div>
            <p className="flex flex-wrap items-center gap-x-3 rounded-base bg-surface-2 px-4 py-3 text-muted" aria-live="polite">
              <span className="text-small">Learners will see</span>
              <span className="font-semibold">{previewPrice ?? "Enter a valid price"}</span>
            </p>
          </Section>

          <Section title="Thumbnail" description="The first thing learners see. A clear, uncluttered image works best.">
            <div className="grid gap-8 md:grid-cols-[400px_minmax(0,1fr)]">
              <FilePicker
                id="courseThumbnail"
                label="Course thumbnail"
                file={thumbnail}
                previewUrl={blobUrl}
                existingUrl={course?.courseThumbnail}
                onSelect={pickThumbnail}
                onRemove={removeThumbnail}
                onInvalid={(message) => setErrors((e) => ({ ...e, courseThumbnail: message }))}
                error={errors.courseThumbnail}
              />
              <div className="flex flex-col gap-2">
                <p className="font-semibold">A good thumbnail</p>
                <p className="text-muted">
                  Use one clear subject, readable text and a flat background. It is shown small in the catalog, so keep it simple.
                </p>
              </div>
            </div>
          </Section>

          <details className="rounded-card bg-surface p-4 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold focus-visible:outline-2 focus-visible:outline-accent-light">
              Preview card
              <Icon name="expand-more" size={24} />
            </summary>
            <div className="mt-4">{preview}</div>
          </details>

          <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end">
            <ButtonLink href="/instructor/dashboard" variant="ghost" size="lg">
              Cancel
            </ButtonLink>
            <Button type="submit" size="lg" loading={saving}>
              {isEdit ? "Save changes" : "Save as draft"}
            </Button>
          </div>
        </form>

        <aside aria-label="Live preview" className="hidden flex-col gap-4 rounded-card bg-surface p-6 lg:sticky lg:top-24 lg:flex">
          <h2 className="text-h3 text-ink">Live preview</h2>
          <p className="text-small text-muted">How your course appears in the catalog.</p>
          {preview}
        </aside>
      </div>
    </main>
  );
}
