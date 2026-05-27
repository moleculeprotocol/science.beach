# GDPR Health Data

**Slug**: `gdpr-health-data`
**Source**: Custom authored
**Version**: 1.0

## Purpose

Apply GDPR Art.9 special-category health data rules to digital health products. Determine the correct lawful basis for processing, assess whether a DPIA is mandatory, identify applicable national derogations, and map GDPR obligations to their HIPAA equivalents. Use this skill whenever a hypothesis involves collecting, processing, or transferring personal health data in the EU or for EU data subjects.

---

## Tools

- `curl` — fetch current EDPB guidelines, GDPR regulation text, HHS HIPAA updates
- `python3` — parse JSON outputs, extract relevant sections
- `bash` — text processing

---

## Authority Sources

Check these before composing any analysis — EDPB guidelines are updated frequently.

```bash
# EDPB guidelines index (all current guidelines, recommendations, best practices):
curl -sI "https://edpb.europa.eu/our-work-tools/general-guidance/guidelines-recommendations-best-practices_en" | grep -i "HTTP/"

# GDPR regulation full text (Art.9 special categories):
curl -sL "https://gdpr-info.eu/art-9-gdpr/" | python3 -c "
import sys, re
text = sys.stdin.read()
# Extract readable text from HTML
text = re.sub(r'<[^>]+>', ' ', text)
text = re.sub(r'\s+', ' ', text).strip()
print(text[:2000])
"

# HHS HIPAA updates page:
curl -sI "https://www.hhs.gov/hipaa/for-professionals/index.html" | grep -i "HTTP/"
```

---

## GDPR Art.9 Framework

### Special Category Health Data

Art.9(1) prohibits processing data revealing health, genetic, or biometric data for the purpose of uniquely identifying a natural person. Prohibition applies unless one of the Art.9(2) exceptions applies.

**Definition trigger questions**:
- Does the product collect symptoms, diagnoses, treatment records, prescriptions, or clinical measurements? → **health data** (Art.4(15))
- Does the product collect DNA, RNA, chromosomal data? → **genetic data** (Art.4(13))
- Does the product use fingerprint, retina, voice for ID purposes? → **biometric data** (Art.4(14))

### Art.9(2) Lawful Bases for Health Data

| Basis | Article | Conditions | Common use case |
|-------|---------|------------|-----------------|
| Explicit consent | Art.9(2)(a) | Freely given, specific, informed, unambiguous; easily withdrawn | Patient apps, consumer wellness |
| Vital interests | Art.9(2)(c) | Data subject or another person cannot give consent | Emergency systems |
| Medical diagnosis / treatment | Art.9(2)(h) | Under professional secrecy obligation | Clinical decision support |
| Public health | Art.9(2)(i) | EU/Member State law; proportionality required | Epidemiology, surveillance |
| Research | Art.9(2)(j) | EU/Member State law; appropriate safeguards; pseudonymisation where possible | Clinical research platforms |
| Substantial public interest | Art.9(2)(g) | Member State law; proportionate; data minimisation | Disease registries |

**Key constraint**: Even where Art.9(2) applies, a separate Art.6 lawful basis for general personal data is still required.

---

## Art.35 DPIA — Mandatory Triggers

A DPIA is mandatory (not optional) when processing is "likely to result in a high risk to the rights and freedoms of natural persons". For health data, the following scenarios always require a DPIA:

| Trigger | GDPR basis | Digital health example |
|---------|-----------|----------------------|
| Systematic processing of special category data at large scale | Art.35(3)(b) | Platform with >1,000 users storing health records |
| Automated decision-making with legal/significant effect | Art.35(3)(a) | AI diagnostic tool making treatment recommendations |
| Systematic monitoring of publicly accessible areas | Art.35(3)(c) | Biometric access + health monitoring |
| Novel technology with high risk | WP29/EDPB guidance | First-in-class AI health app |

**DPIA content requirements** (Art.35(7)):
1. Systematic description of processing and purposes
2. Necessity and proportionality assessment
3. Risk assessment to data subjects
4. Measures to address risks (encryption, pseudonymisation, access controls)

If DPIA concludes "high residual risk" remains → must consult supervisory authority (Art.36).

---

## National Derogations (Art.9(4) + Art.9(2)(j))

Member States may introduce additional conditions or limitations for health data. Key derogations:

### Germany (DE)
- **§ 22 BDSG** (Bundesdatenschutzgesetz): Permits health data processing for medical diagnosis, preventive medicine, assessment of working capacity, medical treatment — under obligation of professional secrecy.
- **§ 27 BDSG**: Research privilege — health data may be processed for scientific research where erasure/anonymisation would "seriously impair" the research purpose.
- Supervisory authority: **BfDI** (Federal) and 16 Landesdatenschutzbehörden (state-level).

### France (FR)
- **Loi Informatique et Libertés (LIL)** as amended: Art.9(2)(h) processing requires healthcare professional secrecy; Art.9(2)(j) research requires CNIL authorisation.
- **CNIL reference methodologies** (MR-001 to MR-006) define conditions for health research processing without individual consent.
- Health data must be hosted on certified **HDS (Hébergeur de Données de Santé)** infrastructure when processed for healthcare purposes.

### UK (post-Brexit)
- **UK GDPR + Data Protection Act 2018 (DPA 2018)**: Sch.1 Part 1 lists conditions equivalent to Art.9(2). Health data processing requires a condition from Sch.1.
- **ICO** is the supervisory authority. DPIA requirement maintained in UK law.
- International transfers from EU → UK: EU adequacy decision in force (adopted June 2021, reviewed every 4 years). UK → EU: UK adequacy regulations in force.
- **Post-Brexit divergence risk**: Monitor UK Data Protection and Digital Information Bill for divergence from EU GDPR.

---

## GDPR ↔ HIPAA Cross-Mapping

| Concept | GDPR | HIPAA |
|---------|------|-------|
| Regulated entities | Any controller/processor of EU data subjects | Covered entities + business associates |
| Health data definition | Art.4(15): broad (includes inferred health data) | PHI: individually identifiable health information in any form |
| Consent | Explicit, specific, revocable (Art.7, 9) | Authorization (45 CFR §164.508); not always required for TPO |
| Data minimisation | Art.5(1)(c) — minimum necessary | Minimum necessary standard (§164.514(d)) |
| Individual rights | Access (Art.15), rectification (Art.16), erasure (Art.17) | Right of access (§164.524); no right to erasure |
| Breach notification | 72 hours to supervisory authority (Art.33); without undue delay to individuals (Art.34) | 60 days to individuals + HHS + media if >500 in state |
| DPA/BAA equivalent | Data Processing Agreement (Art.28) | Business Associate Agreement |
| Cross-border transfer | Art.46 (SCCs, BCRs, adequacy) | No explicit restriction; HIPAA silent on geography |
| Penalty regime | Up to €20M or 4% global annual turnover | Tiered: $100–$50,000/violation; max $1.9M/year per category |

**Dual-jurisdiction flag**: Products serving both EU data subjects and US patients may trigger both GDPR and HIPAA simultaneously. Map obligations for each separately before combining.

---

## Workflow

### Step 1 — Classify Data Type

```bash
# Check current EDPB health data guidance:
curl -sL "https://edpb.europa.eu/our-work-tools/general-guidance/guidelines-recommendations-best-practices_en" \
  | python3 -c "
import sys, re
text = sys.stdin.read()
text = re.sub(r'<[^>]+>', ' ', text)
# Find health data related guidelines
lines = [l.strip() for l in text.split('\n') if 'health' in l.lower() or 'medical' in l.lower()]
print('\n'.join(lines[:20]))
"
```

Answer: Is this Art.9 special category data? (health / genetic / biometric)

### Step 2 — Identify Lawful Basis

From the Art.9(2) table above, identify the most appropriate basis for the product's core processing. If explicit consent (Art.9(2)(a)):
- Is consent genuinely freely given (no bundling with service)?
- Is there a clear withdrawal mechanism?
- Can the service function if consent is withdrawn?

### Step 3 — DPIA Assessment

Apply DPIA trigger checklist:
- Special category data at scale? → mandatory DPIA
- Automated decision-making with significant effect? → mandatory DPIA
- Novel technology + high risk? → DPIA strongly recommended

### Step 4 — National Derogation Check

Identify target markets. For each: Germany, France, UK — apply the derogation conditions above.

### Step 5 — HIPAA Cross-Map (if US data subjects involved)

Determine if the product also constitutes a HIPAA covered entity or business associate. Map PHI obligations alongside GDPR obligations.

### Step 6 — Draft Analysis

Structure output per Output Format section below.

---

## Output Format

```
## GDPR Health Data Assessment

**Data classification**: [health data / genetic data / biometric data / not special category]
**Art.9(2) lawful basis**: [identified basis + rationale]
**Separate Art.6 basis**: [legitimate interests / contract / legal obligation / etc.]
**DPIA required**: [YES (mandatory) / YES (recommended) / NO] — [trigger reason]
**National derogations applicable**: [DE: § 22 BDSG / FR: CNIL MR / UK: DPA 2018 Sch.1 / none]
**HIPAA cross-trigger**: [YES — PHI scope / NO — EU-only product]

### Key Obligations
1. [specific obligation with article reference]
2. [specific obligation with article reference]
3. [specific obligation with article reference]

### Data Subject Rights to Implement
- Access (Art.15): [implementation note]
- Rectification (Art.16): [implementation note]
- Erasure (Art.17): [applicability — research exemption may apply]
- Portability (Art.20): [applicability]

### Cross-Border Transfer Mechanism (if applicable)
[SCCs / adequacy decision / BCRs — with current status]

### ⚠️ Upcoming Changes
[flag any EDPB guidelines under consultation or Member State law changes]

### EVIDENCE GAP
[any open questions requiring legal counsel or DPIA completion before processing begins]
```
