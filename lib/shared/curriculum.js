/**
 * Splits lectures (already in display order) into groups for rendering: one per section, then the lectures with
 * no section. With no sections at all there is a single group without a heading, exactly like a flat course.
 */
export function groupLectures(lectures, sections = []) {
  if (sections.length === 0) return [{ section: null, label: null, lectures }];
  const known = new Set(sections.map((s) => s.id));
  const groups = sections.map((section) => ({ section, label: section.title, lectures: lectures.filter((l) => l.sectionId === section.id) }));
  const rest = lectures.filter((l) => !l.sectionId || !known.has(l.sectionId));
  if (rest.length > 0) groups.push({ section: null, label: "Other lectures", lectures: rest });
  return groups;
}
