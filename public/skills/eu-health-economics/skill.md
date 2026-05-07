# EU Health Economics

**Slug**: `eu-health-economics`
**Source**: Custom authored
**Version**: 1.0

## Purpose

Apply EU health technology assessment (HTA) frameworks to digital health products. Evaluate QALY/ICER thresholds (NICE, IQWiG), determine DiGA conditional reimbursement eligibility under §33a SGB V, assess EU HTA Regulation joint clinical assessment scope, and map AMNOG benefit categories and HAS medico-economic requirements. Use this skill when a hypothesis needs EU payer or HTA analysis.

---

## Tools

- `curl` — fetch NICE guidance, IQWiG methods, G-BA AMNOG resolutions, HAS decisions
- `python3` — parse API responses, extract document lists
- `bash` — text processing

---

## Authority Sources

```bash
# NICE published technology appraisals (live list):
curl -s "https://www.nice.org.uk/guidance/published?type=ta" \
  -o /dev/null -w "%{http_code}"

# IQWiG methods paper:
curl -sI "https://www.iqwig.de/en/methods/methods-paper.3020.html" | grep -i "HTTP/"

# G-BA AMNOG benefit assessment resolutions (German only, but public):
curl -sI "https://www.g-ba.de/beschluesse/" | grep -i "HTTP/"

# HAS transparency committee decisions:
curl -sI "https://www.has-sante.fr/jcms/c_1220693/en/has" | grep -i "HTTP/"

# EU HTA Regulation status (EUCJA rolling out from January 2025):
curl -sI "https://health.ec.europa.eu/health-technology-assessment/regulation_en" | grep -i "HTTP/"
```

---

## NICE Technology Appraisal Framework (UK/England)

### Cost-Effectiveness Thresholds

| Threshold range | NICE treatment |
|----------------|---------------|
| ICER < £20,000/QALY | Generally recommended |
| ICER £20,000–30,000/QALY | End-of-life criteria, severity modifiers apply |
| ICER > £30,000/QALY | Rarely recommended without exceptional circumstances |
| ICER > £50,000/QALY | Only with substantial severity weighting or ONA criteria |

**Severity weighting modifier (from 2022 methods update)**:
- Absolute QALY shortfall ≥ 12 QALYs: weighting factor 1.7
- Absolute QALY shortfall ≥ 18 QALYs: weighting factor 1.7–2.5

**Digital health-specific guidance**:
- NICE Evidence Standards Framework for Digital Health Technologies (DHT): tiered evidence requirements based on function (inform / support / treat)
- DHTs in Tier D (treat/diagnose): full RCT evidence generally required before positive appraisal

### NICE Appraisal Types

| Type | Timeline | Description |
|------|----------|-------------|
| Technology Appraisal (TA) | 12–18 months | Full QALY/ICER assessment; mandatory for NHS England |
| Highly Specialised Technology (HST) | 18–24 months | Ultra-rare conditions; different threshold (£100k/QALY) |
| Medical Technology (MedTech) | 6–12 months | Devices and diagnostics; commercial value-based pricing |
| Evidence review (NICE@home) | 3–6 months | Digital health pilot pathway |

---

## IQWiG / G-BA (Germany — AMNOG)

### AMNOG Benefit Assessment Process (§35a SGB V)

Timeline from market launch to G-BA resolution: approximately **12 months**.

1. **Day 0**: Product launch; manufacturer submits dossier to G-BA
2. **Day 0–3 months**: IQWiG assesses dossier (benefit vs. appropriate comparator)
3. **Month 3–6**: G-BA consultation with medical associations
4. **Month 12**: G-BA benefit resolution published

### IQWiG Evidence Standards

IQWiG uses the **efficiency frontier** approach:
- Compares new intervention to appropriate comparator on effectiveness AND cost
- Must demonstrate **added benefit** (Zusatznutzen) over comparator
- Does not use QALY — uses patient-relevant endpoints (mortality, morbidity, HrQoL)

### Benefit Categories (G-BA Resolution)

| Category | Meaning | Reimbursement implication |
|----------|---------|--------------------------|
| Major added benefit | Substantial improvement in mortality/morbidity | Significant price premium over comparator |
| Considerable added benefit | Moderate improvement | Moderate premium |
| Minor added benefit | Small improvement | Modest premium |
| Non-quantifiable | Improvement but evidence insufficient to quantify | Price negotiation; may be modest |
| No added benefit | Not demonstrated vs comparator | Reference pricing applies |
| Less benefit | Worse than comparator | Rejected |

**Digital health note**: Germany's DiGA pathway (§33a SGB V) bypasses traditional AMNOG for apps. See DiGA section below.

---

## DiGA Fast-Track Pathway (Germany — §33a SGB V)

### Eligibility

A DiGA (Digitale Gesundheitsanwendung) must:
- Be a CE-marked medical device (Class I or IIa) or a Class I wellness/prevention app
- Be a digital application (software, not hardware)
- Primarily serve medical purposes (not merely administrative)
- Be used by the patient themselves (not exclusively by clinicians)

**BfArM DiGA directory**: `https://diga.bfarm.de/de/verzeichnis` (publicly searchable)

### Two-Stage Reimbursement Process

**Stage 1 — Conditional approval (Jahr 1)**:
- Manufacturer applies to BfArM with CE mark + usage evidence plan
- BfArM decision: 3 months
- If approved: immediate statutory reimbursement by all GKV (statutory health insurance funds)
- Manufacturer sets own price for year 1 (negotiated with GKV-SV for year 2+)
- Required: evidence generation study (RCT or high-quality observational) during year 1

**Stage 2 — Permanent listing (Jahr 2+)**:
- Submit evidence from year-1 study to BfArM
- BfArM re-evaluates: additional benefit demonstrated? → permanent listing
- No benefit demonstrated → removed from directory OR downgraded to conditional extension
- Price negotiation with GKV-SV based on year-1 evidence

### DiGA Evidence Requirements

| Evidence tier | Requirement | Examples |
|--------------|-------------|---------|
| Positive care effects | Patient-relevant outcomes (HrQoL, mortality, morbidity) | RCT, registry-based study |
| Positive structural/procedural effects | Improved process outcomes | Adherence, care pathway efficiency |

A positive care effect is required within 12 months; structural effects alone are insufficient for permanent listing.

---

## EU HTA Regulation (Regulation 2021/2282)

### Joint Clinical Assessment (JCA) — Mandatory from 2025

| Product type | Mandatory JCA date |
|-------------|-------------------|
| Oncology medicinal products | January 2025 |
| ATMPs (Advanced Therapy Medicinal Products) | January 2025 |
| Non-oncology medicinal products (orphan) | January 2028 |
| All other medicinal products | January 2030 |
| Medical devices | Scope under review (regulation covers medicines; devices optional) |

**Impact on digital health**:
- Software medical devices (SaMD) classified under MDR are NOT currently in scope of mandatory JCA
- Combination products (device + medicinal product) may be in scope
- National HTA bodies retain authority for economic assessment (ICER/QALY) — JCA covers only clinical assessment

### JCA Process

1. EMA scientific opinion (for medicines) or MDR certification (for devices)
2. HTA Coordination Group (HTACG) assigns to subgroup
3. Joint report (clinical effectiveness + relative effectiveness assessment)
4. National HTA bodies use JCA output for their own economic assessment
5. National reimbursement decisions remain with Member States

---

## HAS (France — Haute Autorité de Santé)

### SMR and ASMR Ratings

**SMR** (Service Médical Rendu — medical benefit): Determines whether the product enters the reimbursable list (Inscrit au remboursement).
- SMR majeur / important / modéré / faible → eligible for reimbursement (% varies)
- SMR insuffisant → not reimbursed

**ASMR** (Amélioration du Service Médical Rendu — improvement): Determines the price premium.
- ASMR I (majeure) → significant price premium
- ASMR II (importante) → moderate premium
- ASMR III (modérée) → modest premium
- ASMR IV (mineure) → premium limited; price parity with comparator in many cases
- ASMR V (absence d'amélioration) → reference pricing

### Medico-Economic Evaluation

Required when: annual treatment cost >£15,000 (threshold adjusted) AND SMR majeur/important AND significant budget impact. HAS Economic Evaluation Guidelines (méthodologie HAS) apply:
- Perspective: collective/societal
- Comparator: most common practice
- Outcome: QALYs or LYG (life years gained)
- Discount rate: 4% (costs and outcomes)
- Time horizon: lifetime or condition-specific

---

## Workflow

### Step 1 — Check NICE Guidance (if UK market relevant)

```bash
# Search NICE for relevant technology appraisals:
curl -s "https://www.nice.org.uk/guidance/published?type=ta" \
  -o /dev/null -w "%{http_code}"
# If 200: search manually for condition/product class
```

Determine QALY/ICER range needed for NICE recommendation.

### Step 2 — AMNOG/DiGA Assessment (Germany)

- Is this a CE-marked Class I or IIa medical device software? → DiGA eligible
- Does it serve individual patients directly? → DiGA eligible
- What evidence is available? → Map to DiGA evidence tier

```bash
# Check BfArM DiGA directory for comparable apps:
curl -sI "https://diga.bfarm.de/de/verzeichnis" | grep -i "HTTP/"
```

### Step 3 — EU HTA Regulation Scope Check

- Is the product a medicinal product (oncology/ATMP)? → JCA mandatory from 2025
- Is it an SaMD under MDR? → Not currently in scope; monitor EU HTA Regulation review

### Step 4 — HAS Assessment (France)

- Estimate SMR based on disease severity and unmet need
- Estimate ASMR based on evidence vs. comparator
- Determine if medico-economic evaluation will be required

### Step 5 — Draft EU HTA Strategy

Structure output per Output Format section below.

---

## Output Format

```
## EU Health Economics Assessment

**Target markets**: [UK / DE / FR / EU-wide]
**NICE QALY assessment**:
  - Evidence tier (DHT framework): [Tier A–D]
  - Comparator: [current standard of care]
  - ICER estimate (if data available): [£X/QALY — confidence: high/medium/low]
  - NICE recommendation likelihood: [positive / uncertain / negative] — [rationale]

**DiGA eligibility (Germany)**:
  - MDR class: [Class I / IIa / not applicable]
  - Direct patient use: [YES / NO]
  - Evidence stage: [year-1 conditional / year-2 permanent / insufficient]
  - Estimated annual revenue (GKV): [range based on prevalence × price]

**AMNOG assessment (Germany)**:
  - Applicable: [YES (if combination product or medicinal component) / NO]
  - Benefit category estimate: [major / considerable / minor / non-quantifiable]

**EU HTA Regulation**:
  - JCA scope: [in scope (oncology/ATMP) / out of scope (SaMD) / uncertain]

**HAS assessment (France)**:
  - SMR estimate: [majeur / important / modéré / faible]
  - ASMR estimate: [I–V]
  - Medico-economic evaluation required: [YES / NO — threshold rationale]

### EU Payer Timeline (pessimistic / realistic / optimistic)
- NICE: [X–Y months]
- DiGA conditional: [3–6 months after CE mark]
- DiGA permanent: [12–18 months after launch]
- HAS: [12–24 months]

### ⚠️ Upcoming Changes
[EU HTA Regulation rollout, DiGA evidence requirement updates, NICE methods updates]

### EVIDENCE GAP
[open questions — use market-intelligence-reports skill to surface NICE appraisals, IQWiG reports, HAS decisions]
```
