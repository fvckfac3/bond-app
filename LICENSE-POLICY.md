# Bond License Policy

> **Draft — not legal advice; requires attorney review before reliance.**

Bond's source code is offered under two licenses. Which one applies depends on who you are and how you use it.

## 1. GNU Affero General Public License v3 (AGPLv3)

The source in this repository is licensed under the AGPLv3; the full text is in [`LICENSE`](LICENSE). It fits:

- individuals and couples running their own copy of Bond,
- researchers, students and hobbyists,
- anyone willing to meet every AGPLv3 obligation.

The AGPLv3's central obligation: if you modify Bond and let other people interact with it over a network, you must offer those people the complete corresponding source of your modified version under the AGPLv3 (section 13). This applies to every self-hoster, including organisations.

## 2. Institutional Commercial License

Clinics, therapists, group practices, treatment centers and other organisations that use Bond with clients need an **Institutional Commercial License** whenever any of these is true:

- they use the Bond-hosted clinician dashboard or institutional plans (a paid subscription; see the tiers in [`README.md`](README.md#pricing)),
- they run a modified Bond for clients and do not want to publish their modifications under the AGPLv3,
- they want to combine Bond with proprietary systems (EHRs, practice-management software) without AGPLv3 obligations reaching that code,
- they need terms the AGPLv3 doesn't give: warranties, indemnity, support, an SLA, or a Business Associate Agreement.

An organisation that self-hosts and fully complies with the AGPLv3 may use the AGPLv3 edition. The AGPLv3 does not let us forbid that, and this policy does not try to. What the AGPLv3 edition does not include is the hosted service, support, any warranty, or the Bond name and logo (see section 4).

Commercial terms are in a separate written agreement. Contact: institutional@bond.app.

## 3. Contributions

Outside contributions are accepted only under the [Contributor License Agreement](CLA.md). The CLA is what allows contributed code to be offered under both licenses.

## 4. Trademarks

Neither license grants rights to the Bond name, logo or other brand assets. A modified or self-hosted deployment must not present itself as the official Bond service.

## 5. Relationship to the Terms of Service and Privacy Policy

These licenses cover the source code. Use of the hosted Bond service, including the mobile app as distributed by us, is governed by the [Terms of Service](legal/TERMS_OF_SERVICE.md) and [Privacy Policy](legal/PRIVACY_POLICY.md). Nothing here changes those documents. Bond is an educational and relationship-wellness product, not therapy, and the Terms' statements to that effect apply to institutional use too.

## 6. Health-data compliance

Bond's clinician features are built to support HIPAA technical safeguards: row-level access control, couple consent before any clinic access, author-only private reflections, and an append-only audit log. **HIPAA compliance has not been established.** Compliance would also require a signed Business Associate Agreement with Bond and with each underlying provider (database, hosting) on HIPAA-eligible plans, plus administrative policies, a risk analysis and breach-notification procedures. Neither license provides any of those. An institution is responsible for its own regulatory obligations.

## 7. Open questions for counsel

- Confirm that all existing code in the repository (including code generated with AI tools and any third-party scaffolding) is owned by, or licensed to, the project owner so that it can be dual-licensed.
- Confirm that the AGPLv3 notice in `LICENSE` is applied to the repository as intended, and decide whether per-file headers are wanted.
- Draft the Institutional Commercial License agreement itself. This document only describes it.
