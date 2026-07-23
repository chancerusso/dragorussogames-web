# Decisions Log

Purpose:
Record design decisions.

Format:

Date:
Decision:
Reason:
Result:

## Seed Entries

Date:
Pending

Decision:
No account character storage at launch.

Reason:
Phase 1 focuses on printable sheets only.

Result:
Approved.

Date:
2026-07-23

Decision:
Adventure-specific monsters retain the adventure title as their source and
coexist with core Monster Manual entries.

Reason:
Adventure records may contain scenario-specific statistics or mechanics and
more adventure monsters will be imported over time. They must not be silently
merged into, relabeled as, or superseded by the core catalog merely because
their names are similar.

Result:
Approved.

Date:
2026-06-17

Decision:
Question: Should we keep classic generation?

Reason:
Ability score generation affects tone, character survivability, and player control.

Options:
- A. 3d6 in order
- B. 4d6 drop lowest arrange
- C. Multiple arrays choose one

Result:
Status: Undecided.

Date:
2026-06-17

Decision:
Character creation pages will follow OSRIC order.

Reason:
Players should learn the game in the same sequence as the rules source, while our explanations and house rules remain separate.

Result:
Approved.

Date:
2026-06-17

Decision:
First Edition pages may include full mechanical rules and tables where license permits.

Reason:
Players should complete character creation and normal play using the website only.

Result:
Approved.

Date:
Pending

Decision:
Character sheets downloadable first.

Reason:
Printable tools are the launch priority.

Result:
Approved.

Date:
Pending

Decision:
Rules written page-by-page.

Reason:
Prevents accidental broad copying and keeps review focused.

Result:
Approved.

Date:
Pending

Decision:
OSRIC is the rules source.

Reason:
The website may reproduce permitted mechanics and tables where the license allows, while adding our own layout, explanations, navigation, and house-rule separation.

Result:
Approved.

Date:
2026-06-17

Decision:
First Edition is a step-by-step online rules manual, not an interactive character builder.

Reason:
Players should read the rules, follow clear steps, make manual choices, write information on a paper or printable character sheet, and continue to the next page. The website may include permitted OSRIC mechanics and tables, but it should not add selectors, form fields, auto-calculation, saved character state, generated character sheets, or account storage.

Result:
Approved. House rules remain clearly separated from official rules and campaign procedures.

Date:
2026-07-23

Decision:
Reuse existing legacy monster records when their structured statistics match
the Monster Manual, but change their official provenance only after
field-by-field verification.

Reason:
Many OSRIC monsters may reproduce the same First Edition mechanics. Updating a
verified row in place preserves stable slugs and saved references while avoiding
unnecessary duplicate records. A record verified completely against the
Monster Manual will use `Monster Manual` as its primary source. A record that
still contains unverified OSRIC-derived fields will retain legacy provenance;
it will not be presented as an official-book record merely because its name
matches.

Result:
Approved.
