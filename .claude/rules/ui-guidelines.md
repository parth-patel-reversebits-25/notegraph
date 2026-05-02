# UI Guidelines

## Tailwind Rules

- Use Tailwind utility classes; avoid inline styles
- Follow existing spacing scale — do not introduce arbitrary values without reason
- Match border radius and shadow tokens already used in project
- Use `src/components/ui/` Radix primitives before building custom
- Use `src/components/common/custom-ui/` wrappers (CustomButton, CustomSelect, etc.) for consistency

## Responsive Design

- Mobile-first: base styles for mobile, `md:`/`lg:` for larger breakpoints
- Separate layout files for layouts with meaningful structural differences across breakpoints
- Re-check mobile, tablet, and desktop breakpoints when UI changes significantly

## States to Always Handle

- Empty state (no data)
- Loading state (skeleton or spinner)
- Error state (inline or toast)
- Button hover, active, and disabled states

## Frontend Design Plugin

- Use the frontend design plugin when generating UI layouts, Tailwind structure, spacing improvements, responsive fixes, or component redesigns
- Prefer it for pixel-perfect styling tasks and screen redesign requests

## Reference-Based Tasks

- Match provided design as closely as possible
- Do not add extra sections, styling, or interactions unless requested
- Compare final implementation against reference at least twice before done

## Major UI Changes Checklist

- Check both light and dark backgrounds if relevant
- Review modal, drawer, dropdown, and tooltip positioning
- Verify sticky headers, tables, tabs, and scrolling behavior
- Ensure no console errors after change
