# Learnly MVP — Figma Design Prompts

How to use: paste **Session preamble** once, then run the prompts **in order**. Prompts F0 and F1 create the design system and shared components; every screen prompt after that must reuse them, never redraw them.

Screen list and states come from `docs/mvp.md` section 8 and the conversation that produced it. Visual identity comes from `landing-page/index.html` (dark theme, deep red accent, Bricolage Grotesque).

Tip: if you use Claude with the Figma connector, say "use the Figma tools" and let it load its Figma skills first. Create or open one Figma file called **Learnly MVP** and give the agent its link.

---

## Session preamble (paste once)

```
You are designing the Learnly MVP in Figma, file "Learnly MVP" (link: <PASTE FIGMA FILE LINK>).
Learnly is a course marketplace: instructors publish video courses, students buy them and watch every lecture.

Visual identity (from our landing page, do not invent a new look):
- Dark theme only. Background #0A0A0A, surface #151515, surface-2 #1F1F1F, text #EFEFEF, muted text #9A9A9A.
- One accent: deep red #B11226, darker #860D1C, lighter tint #D24D61, tints #3A0710 / #5E0B18. Text on accent: white.
- Light "field" surfaces for inputs: #EFEFEF with #0A0A0A text.
- Font: Bricolage Grotesque. Sizes: 14 small, 18 body, 36 lead, 40-60 heading, 56-96 display. Line height 1.5 body, tight for headings.
- Radius 8. Page margin 32 desktop, 16 mobile. Gap 24. 12-column grid, max content width 1200.
- Plain, confident, editorial look. No gradients except subtle red tints, no stock-illustration look, no emoji as icons. Use Material Symbols icons.

Rules:
- Build with Figma variables (colors, spacing, radius), text styles, auto layout and components with variants. No detached copies, no hardcoded colors in frames.
- Every screen: Desktop 1440 and Mobile 390 frames, side by side, named "<Screen> / Desktop" and "<Screen> / Mobile". Put each screen on its own page in the file, named like "05 Login".
- Use realistic sample content (course titles, instructor names, prices in INR). Never lorem ipsum.
- Accessibility: text contrast at least 4.5:1, visible focus state on every interactive component, hit areas at least 44px on mobile.
- Reuse components from the "Components" page. If a screen needs a new reusable piece, add it there first, then use it.
- When done with a prompt, give me the frame names you created and call out anything you were unsure about.
```

---

## F0 — File setup and design system

```
Set up the Learnly MVP file and its design system.

1. Pages: "00 Cover", "01 Foundations", "02 Components", then one page per screen in this order: "03 Landing (reference)", "04 Catalog", "05 Course details", "06 Player", "07 Login", "08 Register", "09 Student dashboard", "10 Profile", "11 Instructor dashboard", "12 Course form", "13 Lecture list", "14 Lecture form", "15 404".
2. On "01 Foundations", create:
   - Color variables (collection "Color"): bg, surface, surface-2, ink, muted, accent, accent-deep, accent-light, accent-tint-1, accent-tint-2, field, field-ink, border (white at 10%), success (#2E9E6A), warning (#D9A441), danger (#E5484D).
   - Number variables: spacing scale 4, 8, 12, 16, 24, 32, 48, 64, 96; radius 4, 8, 16, full.
   - Text styles for Bricolage Grotesque: Display, Heading 1, Heading 2, Lead, Body, Body strong, Small, Caption, Button.
   - Effect styles: subtle elevation for modals and dropdowns; focus ring (3px accent, 3px offset).
   - A documented specimen of colors, type and spacing.
3. Add a grid style for desktop (12 columns, 32 margin, 24 gutter) and mobile (4 columns, 16 margin, 16 gutter).
4. Icon set: import the Material Symbols icons we will need as components: search, menu, close, play_arrow, lock, check_circle, star, edit, delete, add, upload, link, visibility, visibility_off, expand_more, expand_less, chevron_left, chevron_right, account_circle, logout, dashboard, school, payments, schedule, error, info.
5. On "00 Cover", a simple cover: "Learnly MVP", date, and a status label.
```

---

## F1 — Shared components

```
On the "02 Components" page, build these components with variants, auto layout and variables. Show every variant in a labeled grid.

- Button: variants primary (accent fill), secondary (outline), ghost, danger; sizes md and lg; states default, hover, pressed, focus, disabled, loading (spinner); optional leading/trailing icon.
- Text input: label, field, helper text, error text; states default, focus, filled, error, disabled; with optional leading icon. Password variant with show/hide icon.
- Textarea, Select (closed, open with options), Checkbox, Toggle switch (off, on, disabled), Radio card (used for Student / Instructor choice), Search input with clear button.
- File picker: empty dropzone (dashed, "Drop an image or browse"), with preview and replace/remove buttons, error state.
- Video upload: idle, uploading (progress bar with percent and cancel), done (file name, duration, replace), failed (retry).
- Category chip (default, selected), status pill (Published, Draft), badge ("Free preview", "Enrolled", "Free").
- Navbar: three variants. (a) Signed out: logo, Courses link, search, Log in, Sign up. (b) Student: logo, Courses, search, avatar menu. (c) Instructor: same with an extra "Instructor dashboard" link. Plus mobile versions (hamburger with a full-screen menu). Include the avatar dropdown (name, email, Dashboard, Profile, Log out).
- Footer: logo, short tagline, link columns, copyright. Desktop and mobile.
- Course card: thumbnail 16:9, category label, title (2 lines max), creator name, price with currency symbol or "Free", optional "Enrolled" badge. Variants: default, hover, enrolled, loading skeleton. Also a horizontal compact variant used on dashboards (thumbnail left, title, status, actions).
- Stat card: label, big number, optional icon.
- Lecture row: index, title, duration, state (locked, free preview, playable, now playing), and a management variant with edit/delete icons.
- Modal: confirm dialog (title, message, cancel, confirm in danger style), with scrim. Focus is trapped (show the focus ring on the first button).
- Toast: success, error, info.
- Empty state: icon, title, short text, primary button.
- Skeleton blocks for text lines, cards and list rows.
- Pagination: previous, page numbers, next; current page state.
- Tabs (All / Published / Draft) with counts.
Document the naming of each variant property so developers can map them directly to props.
```

---

## F2 — Catalog `/courses`

```
Design the course catalog on page "04 Catalog" using the shared components.

Desktop 1440 and Mobile 390. Content:
- Navbar (signed out variant on the main frame).
- Page header: heading "Explore courses", one line of supporting text.
- Toolbar: search input, sort select (Newest, Price low to high, Price high to low), a "Clear filters" ghost button that only shows when filters are on.
- Category chips in a row (wraps or scrolls horizontally on mobile): All, Web Development, AI & Machine Learning, Programming & Systems, Data Science, UI/UX & Design Systems, Cloud & DevOps.
- Grid of 12 course cards (4 columns desktop, 1 column mobile with 2-up optional on tablet) with varied realistic titles, creators and prices (₹499 to ₹4,999 and a couple of "Free"). One card shows the "Enrolled" badge.
- Pagination below, then the footer.
Extra frames for states (desktop only): (1) loading skeleton grid, (2) no results with an empty state and a "Clear filters" button, (3) active search with a result count line "24 courses for 'react'", (4) error state with retry.
```

---

## F3 — Course details `/courses/[id]`

```
Design the course details page on "05 Course details". The same layout is used for several viewers, so build one main design and then state frames.

Main desktop layout (1440): two columns. Left (about 8 columns): breadcrumb, category label, course title, subtitle, creator row (avatar, name), "Last updated" and lecture count and total duration, a hero video/thumbnail area, "About this course" description, curriculum card with a collapse/expand toggle listing lecture rows (lock icon on locked lectures, "Free preview" badge with a play button on preview lectures), and an instructor card. Right (about 4 columns): sticky purchase card with thumbnail, price (₹ amount, large), the primary button, a short list of what's included (lifetime access, N lectures, watch on any device), nothing else.
Mobile 390: single column; purchase card becomes a sticky bottom bar with price and the button.

State frames (desktop, purchase card and header change):
1. Anonymous visitor, paid course: button "Buy Now" (secondary line: "Log in to purchase").
2. Signed-in student, paid course: "Buy Now".
3. Signed-in student, free course: price "Free", button "Enroll Now".
4. Enrolled student: button "Start Course", an "Enrolled" badge, and curriculum fully unlocked.
5. Instructor viewing their own draft: a red "Draft — only you can see this" banner at the top, button "Edit course".
6. Free preview playing: the hero turns into a video player with controls, and a "Preview" label.
7. Payment in progress (button loading) and payment failed (inline error with order id and "Contact support" text).
8. Loading skeleton and a 404-style "Course not found" frame.
```

---

## F4 — Course player `/learn/[id]`

```
Design the course player on "06 Player". It must feel focused and calm.

Desktop 1440: a slim top bar (back arrow to the course page, course title, progress area left empty since progress is not in the MVP). Main area: a large 16:9 video player with a custom-styled control bar (play/pause, seek bar, time, volume, speed, fullscreen; no download button), then below it the lecture title, description, and previous/next lecture buttons. Right: a collapsible sidebar (360 wide) titled "Course content" with lecture rows showing index, title, duration and the active lecture highlighted in accent tint; a button to collapse it.
Mobile 390: video on top, lecture title and prev/next below, and the lecture list as a bottom-aligned section (or a segmented "Lectures" / "About" switcher).

State frames: sidebar collapsed (video fills the width), a YouTube-embedded lecture, loading (skeleton for video and list), the video failed to load with a "Reload video" button, and the "You are not enrolled" redirect message screen with a button to the course page.
```

---

## F5 — Login `/login`

```
Design Login on "07 Login".

Desktop 1440: split layout. Left: a form panel with the logo, heading "Welcome back", fields email and password (with show/hide), primary button "Log in", and a line "New to Learnly? Create an account". Right: a brand panel using accent tints, a short pull-quote or a simple abstract course-card collage built from our components (no stock imagery).
Mobile 390: just the form on the dark background with the logo on top.
State frames: default, field focus, validation errors (empty email, short password), wrong credentials (a top error banner reading "Invalid credentials"), loading button. There is no Google button, no "Forgot password" link, and no social login in the MVP.
```

---

## F6 — Register `/register`

```
Design Register on "08 Register", visually paired with Login.

Fields: full name, email, password (helper text "At least 8 characters"), and a two-option Radio card group: "I want to learn" (Student) and "I want to teach" (Instructor) with a one-line description each. Primary button "Create account", and a line "Already have an account? Log in".
Desktop and mobile as in Login. State frames: default, Instructor selected, validation errors, email already registered (error "An account with this email already exists"), loading.
No email verification step and no social sign-up in the MVP.
```

---

## F7 — Student dashboard `/dashboard`

```
Design the student dashboard on "09 Student dashboard" with the student navbar.

Desktop: greeting heading by time of day ("Good evening, Tejas"), a stat card row with just "Courses enrolled" (there is no progress tracking in the MVP), then "My courses" with a grid of enrolled course cards, each with thumbnail, title, instructor and a "Continue" button. A secondary row "Discover more" with a link to the catalog is optional.
Mobile: single column cards.
State frames: empty (no courses yet, empty state with "Browse courses"), loading skeleton, error with retry, and a state right after a successful purchase with a success toast "You're enrolled".
```

---

## F8 — Profile `/me`

```
Design the profile page on "10 Profile".

Layout: heading "Your profile". Card 1 "Account": avatar placeholder (initials; no upload in the MVP), name field with Save button, email shown read-only with a lock icon, and role displayed as a pill. Card 2 "Change password": current password, new password, confirm new password, button "Update password", helper text that other devices will be signed out.
Desktop: cards in a centered column (max 720). Mobile: full width.
State frames: default, field errors, success toast "Password updated", wrong current password error, loading. No delete account and no notification settings in the MVP.
```

---

## F9 — Instructor dashboard `/instructor/dashboard`

```
Design the instructor dashboard on "11 Instructor dashboard" with the instructor navbar.

Desktop: heading "Your courses" with a primary button "Create course"; three stat cards (Total courses, Published, Total students); a toolbar with tabs All / Published / Draft (with counts) and a search input; a list of compact course rows: thumbnail, title, status pill, price, enrolled count, lecture count, a publish/unpublish toggle, and actions (Edit, Manage lectures, Delete as icon buttons with tooltips). A "Load more" button at the end.
Mobile: stat cards stack or scroll horizontally; rows become cards with an overflow menu for actions.
State frames: empty ("Create your first course"), loading skeleton, delete confirmation modal, delete blocked (a toast or modal "This course has students. Unpublish it instead."), publish blocked ("Add at least one lecture before publishing"), and a row with the toggle mid-update.
```

---

## F10 — Course form `/courses/create` and `/courses/edit/[id]`

```
Design the course form on "12 Course form". One design serves both create and edit.

Layout: heading "Create course" (variant: "Edit course"); form sections: Basics (title, subtitle, description textarea), Details (category select with the 6 categories, currency select INR / USD / EUR, price number input with a live formatted preview), Thumbnail (file picker with 16:9 preview, helper "JPEG, PNG or WebP, up to 5 MB"). A right-hand live preview card showing how the course card will look (desktop only). Footer actions: Cancel (ghost) and "Save as draft" / "Save changes" (primary).
State frames: empty create form, filled form, edit form with an existing thumbnail, validation errors (missing title, price below zero, wrong file type, file too large), saving state, and a server error banner.
Mobile: single column with the preview collapsed.
```

---

## F11 — Lecture list `/courses/[id]/lectures`

```
Design lecture management on "13 Lecture list".

Layout: breadcrumb (Dashboard / Course title / Lectures), heading with course title, status pill and a primary button "Add lecture"; summary line "8 lectures, 2 free previews"; a title search input; a vertical list of management lecture rows (index, title, duration, "Free preview" badge, edit and delete icons); a "Publish course" call-to-action bar at the bottom when the course is a draft and has at least one lecture.
Desktop and mobile. State frames: empty ("No lectures yet. Add your first lecture."), loading skeleton, delete confirmation modal, and a search with no matches.
```

---

## F12 — Lecture form `/courses/[id]/lectures/create` and `/edit/[lectureId]`

```
Design the lecture form on "14 Lecture form". One design for create and edit.

Layout: heading "Add lecture" (variant "Edit lecture"); fields: title, description, a segmented control "Upload video" | "Paste video URL"; in upload mode the video-upload component (drop zone with limit text "MP4 or WebM, up to 500 MB"); in URL mode a URL input plus duration inputs (minutes and seconds); a Toggle "Free preview — anyone can watch this lecture"; actions Cancel and Save lecture.
State frames: upload idle, file chosen, uploading at 45% with cancel, upload finished showing detected duration, upload failed with retry, file too large error, URL mode with an invalid URL error, edit mode showing the current video with a "Replace video" button, and "Upload succeeded but saving failed" with a Retry save button (no re-upload).
Desktop and mobile.
```

---

## F13 — 404 and global error

```
Design "15 404" in the same visual style: large display "404", a short friendly line, and two buttons ("Go home", "Browse courses"). Add a generic "Something went wrong" error screen variant with a Retry button. Desktop and mobile.
```

---

## F14 — Landing page reference

```
On "03 Landing (reference)", bring in the existing landing page for reference so developers see everything in one file. Either import landing-page/index.html into Figma (HTML to design) or rebuild its sections as frames: hero, category explorer, featured courses ("Learn from the best"), how it works, feature showcase, testimonials, FAQ, closing call to action, footer. Connect it to the Navbar, Footer and Course card components from "02 Components" wherever they appear. Do not redesign it; only note anything that needs changing for the app: real course data in the featured section, "Teach on Learnly" button, and removing invented testimonials or stats.
```

---

## F15 — Design review pass

```
Review the whole file against these checks and fix what fails:
1. No detached components or hardcoded colors; everything uses variables and text styles.
2. Every screen has Desktop 1440 and Mobile 390 frames and the listed state frames.
3. Navbar, footer, buttons, inputs and course cards are identical everywhere they appear.
4. Contrast of muted text on surfaces is at least 4.5:1; focus rings visible; mobile hit areas at least 44px.
5. Naming: "<Screen> / <Viewport> / <State>". Pages numbered as in F0.
6. Nothing in the designs implies a deferred feature (Google login, forgot password, progress bars, avatar upload, notifications, admin).
7. Add a "Handoff" page: a table mapping each page route in docs/mvp.md section 8 to its Figma frame name.
Report what you changed.
```
