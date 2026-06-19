# Changelog

Track website milestones.

Format:

Date

Added

Changed

Removed

Date:
2026-06-18

Added:
004 Alignment completed
005 Starting Wealth completed
006 Equipment completed
007 Hit Points completed
008 Languages completed
Unnumbered character creation content mirrors for alignment, starting wealth, equipment, hit points, and languages

Changed:
Character Creation flow now reads Ability Scores, Race, Class, Alignment, Starting Wealth, Equipment, Hit Points, Languages
Equipment page now uses compact boxed tables, sticky category navigation, recommended starting kits, and notebook guidance
Renderer now supports selectable-style subcards for alignment choices and starting kit examples

Date:
2026-06-17

Added:
001 Ability Scores

Changed:
001 Ability Scores revised for onboarding and terminology clarity

Date:
2026-06-17

Added:
002 Race

Changed:
002 Race finalized for race selection workflow
002 Race expanded into complete race selection reference

Date:
2026-06-17

Added:
003 Class created

Changed:
003 Class corrected for full-rules model review
TODO: Need table responsiveness pass for class tables.

Date:
2026-06-17

Summary:
Today focused on correcting project direction and restoring the intended First Edition experience.

The goal was not adding features.

The goal was restoring a rules-first, old-school experience.

Philosophy Reset:
Established and documented the permanent direction for Drago Russo Games First Edition.

Created:
DRG1e_MasterInstructions.md

Core principles established:
- Rules-first experience
- Character creation guide
- Online reference
- Paper character sheets
- No character builder
- No stored character data
- No game application behavior
- OSRIC + AD&D 1e + Drago Russo house rules
- D&D Beyond inspiration for presentation only

UX / Navigation Refactor:
- Removed procedural public numbering from navigation
- Improved chapter-style navigation
- Strengthened internal linking
- Preserved numbered URLs internally where useful
- Reduced internal/admin language appearing publicly

Result:
Character creation now reads more like a guided rulebook.

Rules Content Restoration:
- Restored actual Race content
- Restored actual Class content
- Removed empty placeholder reference behavior
- Restored Monk as class content
- Restored Bard as Advanced / Special Entry

Result:
Reference pages contain rules instead of stubs.

Removed Non-Core Experiences:
- Downloads hub
- Reference hub
- Character sheet placeholders
- Session sheet placeholders
- Inventory sheet placeholders
- Party tracker concepts
- Campaign log concepts
- Coming Soon cards
- Builder language

Result:
Site returned to its intended scope.

Rendering + Presentation Fixes:
- Restored Markdown table rendering
- Fixed raw pipe table output
- Converted class tables into real HTML tables
- Improved mobile table containment
- Tightened spacing across rule panels
- Reduced oversized cards
- Converted Write This Down into compact notebook-style blocks

Verified:
- Cleric tables render correctly
- Paladin tables render correctly
- Mobile overflow corrected

Technical Notes:
Files primarily affected:
- components/first-edition-app.js
- styles/first-edition.css
- content/1e/**
- layouts/first-edition-page.html

Validation completed:
- renderer checks
- browser checks
- mobile review
- route verification
- smoke testing

Status:
Character Creation is approximately 90-95% complete.

Remaining work:
- final visual review
- minor spacing adjustments
- wording cleanup
- final QA pass

Next phase:
How to Play

Then:
Procedures / Table Play

Then:
Rules + Combat Bot

End of day.
