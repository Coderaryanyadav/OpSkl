# OpSkl Engineering Constitution v1.0

This document defines the core coding standards, product principles, and architectural guidelines for the OpSkl repository.

---

## ARTICLE 1 — Mission
Build the highest-quality professional services platform possible.
Every decision must improve at least one of:
* User value
* Security
* Reliability
* Scalability
* Maintainability
* Developer productivity
* Business sustainability

Never optimize for code quantity. Optimize for product quality.

---

## ARTICLE 2 — Principles
Always:
* Prefer simple solutions over clever ones.
* Remove unnecessary complexity.
* Design for maintainability.
* Keep documentation synchronized with implementation.
* Protect user data.
* Make trade-offs explicit.

Never:
* Add placeholder features.
* Falsify implementation status.
* Introduce unnecessary dependencies.
* Duplicate logic.
* Ship code that cannot be reasonably maintained.

---

## ARTICLE 3 — Engineering Standards
Every new feature must include:
* Architecture review
* Security review
* Error handling
* Logging
* Tests
* Documentation
* Performance considerations
* Accessibility considerations

If any of these are missing, the feature is incomplete.

---

## ARTICLE 4 — Decision Process
Before implementing a significant change:
1. Define the problem.
2. Identify constraints.
3. List at least three approaches.
4. Compare trade-offs.
5. Recommend one approach.
6. Explain why it is preferred.

Do not assume the first idea is the best idea.

---

## ARTICLE 5 — Continuous Review
At the end of every implementation:
* Look for duplicated code.
* Look for architectural improvements.
* Look for security improvements.
* Look for documentation updates.
* Look for performance opportunities.

Fix what is practical before moving on.

---

## ARTICLE 6 — Product Thinking
Every feature must answer:
* Who benefits?
* What problem is solved?
* How will success be measured?
* What is the maintenance cost?
* Could this be simplified?

If the answers are weak, reconsider the feature.

---

## ARTICLE 7 — Security
Assume hostile input. Validate everything. Protect secrets. Follow least privilege. Audit sensitive operations. Document security assumptions. Treat security as a design requirement, not a final checklist.

---

## ARTICLE 8 — AI
AI should augment users, not replace judgment. Design prompts, agents, and workflows to be:
* Transparent
* Observable
* Evaluatable
* Cost-aware
* Robust against failure

Maintain prompt versioning and evaluation datasets.

---

## ARTICLE 9 — Documentation
Documentation must reflect reality. If implementation changes, update documentation in the same change. Do not describe features that do not exist.

---

## ARTICLE 10 — Success
The objective is not to produce the largest repository. The objective is to produce software that users trust, engineers enjoy maintaining, and businesses are willing to adopt. Every contribution should move OpSkl closer to that goal.
