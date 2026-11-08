import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  Circle,
  CircleAlert,
  CircleCheck,
  CircleDot,
  Clock,
  Eye,
  EyeOff,
  FilterX,
  GraduationCap,
  ImageIcon,
  LifeBuoy,
  LoaderCircle,
  Lock,
  Mail,
  PanelRightClose,
  Pencil,
  Play,
  Plus,
  Presentation,
  Replace,
  RotateCw,
  Search,
  SearchX,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
  Users,
  Video,
  X,
} from "lucide-react";

// Default colors, taken from the colors the previous SVG icons were drawn in. A `text-*` class passed as
// `className` replaces the default; "inherit" icons take the surrounding text color (for example inside a button).
const INK = "text-ink";
const MUTED = "text-muted";
const ACCENT = "text-accent-light";
const DANGER = "text-danger";
const SUCCESS = "text-success";
const WARNING = "text-warning";
const ON_ACCENT = "text-accent-ink";
const ON_LIGHT = "text-field-ink";
const FIELD_HINT = "text-field-muted";

// Each icon the app uses: [Lucide icon, default color, options]. Names are kept from the old icon set so no call site changed.
const ICONS = {
  add: [Plus, INK],
  "add-sm": [Plus, INK],
  "arrow-forward": [ArrowRight, INK],
  "back-course": [ArrowLeft, INK],
  cancel: [X, INK],
  close: [X, INK],
  "close-sm": [X, INK],
  remove: [X, INK],
  check: [Check, ACCENT],
  "check-sm": [Check, ACCENT],
  "check-badge": [Check, ON_LIGHT],
  "check-circle": [CircleCheck, SUCCESS],
  "chevron-left": [ChevronLeft, MUTED],
  "chevron-right": [ChevronRight, INK],
  "choice-learn": [GraduationCap, INK],
  "choice-teach": [Presentation, INK],
  "collapse-all": [ChevronsDownUp, INK],
  "expand-all": [ChevronsUpDown, INK],
  continue: [ArrowRight, ON_ACCENT],
  delete: [Trash2, DANGER],
  "delete-row": [Trash2, INK],
  "delete-sm": [Trash2, ON_LIGHT],
  "dot-draft": [Circle, WARNING, { fill: true }],
  "dot-published": [Circle, SUCCESS, { fill: true }],
  edit: [Pencil, INK],
  "edit-sm": [Pencil, INK],
  "error-banner": [CircleAlert, DANGER],
  "error-field": [CircleAlert, DANGER],
  "error-lg": [CircleAlert, DANGER],
  "error-md": [CircleAlert, DANGER],
  "error-panel": [CircleAlert, DANGER],
  "toast-error": [CircleAlert, DANGER],
  // The two caret icons sit inside light form fields by default; pass a text color class on a dark surface.
  "expand-less": [ChevronUp, ON_LIGHT],
  "expand-more": [ChevronDown, ON_LIGHT],
  "filter-clear": [FilterX, INK],
  "hide-panel": [PanelRightClose, INK],
  image: [ImageIcon, MUTED],
  lock: [Lock, MUTED],
  mail: [Mail, MUTED],
  next: [ChevronRight, ON_ACCENT],
  prev: [ChevronLeft, INK],
  "play-arrow": [Play, ACCENT, { fill: true }],
  "play-arrow-badge": [Play, ACCENT, { fill: true }],
  "play-row": [Play, INK],
  "play-row-active": [Play, ON_ACCENT, { fill: true }],
  publish: [Upload, ON_ACCENT],
  "radio-selected": [CircleDot, ACCENT],
  reload: [RotateCw, ON_ACCENT],
  replace: [Replace, INK],
  "replace-video": [Replace, INK],
  retry: [RotateCw, ON_ACCENT],
  "retry-lg": [RotateCw, ON_ACCENT],
  schedule: [Clock, MUTED],
  "school-empty": [GraduationCap, MUTED],
  search: [Search, FIELD_HINT],
  "search-empty": [SearchX, MUTED],
  spinner: [LoaderCircle, ON_ACCENT],
  "start-course": [Play, ON_ACCENT],
  "stat-courses": [BookOpen, MUTED],
  "stat-enrolled": [GraduationCap, MUTED],
  "stat-published": [CircleCheck, MUTED],
  "stat-students": [Users, MUTED],
  support: [LifeBuoy, INK],
  "toggle-off": [ToggleLeft, MUTED],
  "toggle-on": [ToggleRight, ACCENT],
  videocam: [Video, INK],
  "videocam-md": [Video, INK],
  "videocam-lg": [Video, MUTED],
  visibility: [Eye, ON_LIGHT],
  "visibility-off": [EyeOff, ON_LIGHT],
};

// Decorative: the label next to an icon carries the meaning, so icons are hidden from assistive technology.
export function Icon({ name, size = 20, className = "" }) {
  const entry = ICONS[name];
  if (!entry) {
    if (process.env.NODE_ENV !== "production") console.warn(`Unknown icon "${name}"`);
    return null;
  }
  const [Lucide, color, options] = entry;
  const colorClass = /(^|\s)text-/.test(className) ? "" : color;
  return (
    <Lucide
      aria-hidden="true"
      focusable="false"
      size={size}
      // Thin strokes look weak at small sizes, so the smallest icons are drawn a little bolder.
      strokeWidth={size <= 16 ? 2.25 : 2}
      fill={options?.fill ? "currentColor" : "none"}
      className={`shrink-0 ${colorClass} ${className}`}
    />
  );
}
