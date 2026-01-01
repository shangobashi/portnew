# Content Audit - Portfolio Update December 2025

## Entity Mapping (source → render)
- **Kingsley**: App.jsx:445-453 → Projects section (card 1)
- **Plethora**: App.jsx:454-463 → Projects section (card 2)
- **Shango.GBA**: App.jsx:465-472 → Projects section (card 3)
- **Bio text**: App.jsx:585-596 → About section (2 paragraphs)
- **Skills data**: App.jsx:475-481 → About section (skills grid)
- **Credentials**: App.jsx:483-492 → About section (credentials list)

## File Types Found
- **Data (JSON/YAML)**: None found
- **Content (MD/MDX)**: None found
- **Inline content (TS/TSX/JSX/Vue)**: `src/App.jsx` (all content inline)

## Slot Counts (VISIBLE at 1920px)
- **Projects/cards shown**: 3 (Kingsley, Plethora, Shango.GBA)
- **Skills**: 5 (Full Stack Development, AI & Machine Learning, Blockchain Technology, UI/UX Design, Sound Engineering)
- **Certifications/Credentials**: 8 items in list
- **Timeline entries**: 0 (no timeline section exists)

## Constrained Text Lengths (CHAR COUNT of current text)
- **Hero subtitle** (line 544-547): 95 chars
  - Current: "Full-Stack Engineer crafting the future through AI, Blockchain, and Creative Technology"
- **Bio paragraph 1** (lines 585-590): ~237 chars
  - Current: "I'm a passionate Full Stack Engineer with a deep fascination for emerging technologies. My journey spans across AI and blockchain development, where I create innovative solutions that push the boundaries of what's possible."
- **Bio paragraph 2** (lines 591-596): ~225 chars
  - Current: "Beyond code, I'm a sound engineer and artist, bringing a unique creative perspective to technical challenges. This blend of technical expertise and artistic vision allows me to craft experiences that are both functional and beautiful."
- **Project card descriptions**:
  - Kingsley (line 447): ~252 chars
  - Plethora (line 456): ~339 chars
  - Shango.GBA (line 467): ~281 chars

## Sections Present (by wiring)
- [x] About/Bio/Overview (lines 569-634)
- [x] Skills/Stack/Tooling (lines 475-481, rendered 616-630)
- [x] Education/Background/Studies (COMBINED with Certifications)
- [x] Certifications/Credentials (lines 483-492, rendered 599-612)
- [ ] Courses (NOT separate from certs)
- [x] Projects/Work/Portfolio (lines 443-473, rendered 637-712)
- [ ] Experience/Timeline/Work History (MISSING)

## Sections Missing (skip CONDITIONAL content)
- Timeline/Experience section does not exist
- Education is combined with Certifications (no separate section)
- Courses are part of the Credentials list

## Update Strategy
1. **Bio/About**: Replace 2 paragraphs with locked narrative (truncate to fit existing char limits)
2. **Projects**: Update 3 project descriptions to SHORT variants
3. **Skills**: Replace 5 skill labels with priority skills from spec
4. **Credentials**: Replace 8 items with Career Paths + top individual courses
5. **Hero subtitle**: Update to reflect new title/positioning
6. **Timeline**: SKIP (section does not exist)
