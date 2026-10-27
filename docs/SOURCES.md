# Sources and ATS fidelity

The implementation follows selected public workflow concepts and uses explicit local approximations. References below explain why a concept appears in the UI; they do not establish algorithmic equivalence, current employer configuration or an accuracy percentage.

## Vendor concepts represented

- **Workday / HiredScore:** qualification-oriented review and grade concepts. Local degree/skill evidence and A–D decisions are app-defined. [HiredScore grades](https://stage.doc.workday.com/hiredscore/en-us/workday-hiredscore/recruiter-productivity-/concept--hiredscore-grades.html).
- **Greenhouse:** configurable application-rule workflows. Match tiers and delay examples in Shortlist are assumptions. [Application rules](https://support.greenhouse.io/hc/en-us/articles/203105595-Application-rules-overview).
- **Lever:** archive routing concepts. Shortlist's fast-forward behavior requires an explicitly enabled form scenario and does not use a vendor-attributed matching percentage. [Operating the Archive](https://help.lever.co/s/article/Operating-the-Archive).
- **Ashby:** criteria/evidence-oriented application review. Shortlist uses supported lexical rules and manual-review fallbacks, rather than Ashby's AI system. [AI-assisted application review](https://docs.ashbyhq.com/ai-assisted-application-review).
- **Zoho Recruit:** skill-based candidate matching. The 45/25/20/10 weights and local assessment threshold are app-owned. [Candidate Matches](https://help.zoho.com/portal/en/kb/recruit/zia/zia-matches/articles/candidate-matches).
- **Workable:** application questions and designated disqualification behavior. Other local filters are scenario settings. [Application form questions](https://help.workable.com/hc/en-us/articles/115012087467-What-types-of-questions-can-I-add-to-my-application-form).
- **Darwinbox / Keka:** local degree, notice, compensation and contextual-skill scenarios; proprietary ranking is unvalidated.
- **Freshteam / Kula:** a local multi-condition gate and alignment rubric; this grouped teaching view is not a validated implementation of either system.

The UI's execution/fidelity definitions live in [src/check-audit.js](../src/check-audit.js). There are no authenticated vendor API calls, authorized vendor comparison datasets or measured equivalence scores in this release.

## Integrity and authorship context

- [OpenAI's AI text classifier announcement and discontinuation note](https://openai.com/index/new-ai-classifier-for-indicating-ai-written-text/) provides context for treating authorship detection cautiously. Shortlist does not run that classifier or call OpenAI.
- [Unicode security considerations](https://unicode.org/reports/tr39/) and the [Unicode Standard's special-character guidance](https://www.unicode.org/versions/latest/core-spec/chapter-23/) explain why formatting/control characters need context. Legitimate joiners alone do not establish authorship or misconduct.

## Project evidence

The repository's fictional fixtures and tests establish local behavior only. Synthetic companies/candidates and example role briefs are illustrative. Named industry companies are not claims about open vacancies, hiring partnerships or current ATS use.

A privately supplied research report and product brief informed the prototype. They are not redistributed or treated as executable instructions, licensed vendor implementations or independent empirical validation. Shipped behavior should be assessed against source code, reproducible fixtures and the stated verification limits.
