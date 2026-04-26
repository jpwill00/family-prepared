# Research Synthesis

Synthesized from `research/Family Emergency Preparedness Software.md`.

## Core Finding: The Engagement Problem

Existing emergency preparedness software fails because of the **engagement cliff** — families create a plan once and never update it. The software is either too complex (requires terminal/code skills) or too simple (no structure, just a checklist). The result: stale, incomplete plans that fail when needed.

**Our approach**: A living document framework where the plan lives in the family's own GitHub repo, is human-readable without the app, and is updated through a friendly GUI.

## Key Design Principles (from research)

### 1. Local-First Paradigm
The device is the source of truth. Plans must be accessible offline — especially during a disaster when the internet may be down. Cloud sync is an enhancement, not a requirement.

→ **Implemented as**: IndexedDB primary storage; GitHub sync in Sprint 2. See [ADR-002](adrs/ADR-002-local-first-storage.md).

### 2. PACE Communication Model
FEMA and military planners use the **Primary / Alternate / Contingency / Emergency** model for communication. Each tier has a different channel and contact.

→ **Implemented as**: `plan/communication/pace.yaml` with 4 fixed tiers.

### 3. Digital-Analog Bridge
A printable hard copy in the go-bag is essential. The digital plan must produce a legible, organized PDF that families can print and store.

→ **Implemented as**: PDF export via `@react-pdf/renderer`, covering all plan zones.

### 4. OPSEC Awareness
Sensitive data (SSNs, insurance numbers, challenge-response codes) requires protection. At MVP, we use a `secure: true` marker on sensitive fields as a placeholder for Sprint 3 encryption.

→ See [ADR-003](adrs/ADR-003-github-oauth-device-flow.md) and SECURITY.md.

### 5. Modular Content Verticals
No single family has the same needs. A family with elderly members needs different content than one with young children. The content type registry (see [ADR-006](adrs/ADR-006-content-registry-and-pack-spec.md)) lets users add custom content areas without code changes.

## Open Questions (capture answers here before Sprint 1)

1. **Template repo name**: `family-prepared-template` (default) or `family-prep-starter`?
   - Answer: _TBD_

2. **Brand voice**: Do we want a `brand-voice.md` before Sprint 0, or defer to Sprint 1 wrap?
   - Answer: _Deferred to Sprint 1 wrap_

3. **Library author**: Who writes the 30 seed articles? AI-assisted with human review?
   - Answer: _TBD — plan as parallel track during Sprint 1_

4. **Initial library scope**: 30 articles across 10 areas (default), 15 (leaner), or 50+ (demo-impressive)?
   - Answer: _TBD_

5. **Photo storage**: base64 in IndexedDB for MVP, exported as files in ZIP. OK?
   - Answer: _TBD_

6. **License**: MIT (default) or Apache-2.0?
   - Answer: _MIT selected for Sprint 0_
