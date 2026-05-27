# US Market Access

**Slug**: `us-market-access`
**Source**: Custom authored
**Version**: 1.0

## Purpose

Navigate the US reimbursement landscape for digital health and medical device products. Identify the applicable CPT codes, assess CMS National and Local Coverage Determinations, estimate commercial insurer prior authorisation requirements, and map the revenue model to the most viable access pathway. Use this skill when a hypothesis needs US market access analysis.

---

## Tools

- `curl` — query CMS Coverage Database, check AMA CPT resources, fetch insurer policy pages
- `python3` — parse JSON responses from CMS API
- `bash` — text extraction

---

## Authority Sources

```bash
# CMS Medicare Coverage Database — NCD list:
curl -s "https://www.cms.gov/medicare-coverage-database/api/ncd.json?limit=5" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(json.dumps(d, indent=2)[:1000])" \
  2>/dev/null || echo "Try manual: https://www.cms.gov/medicare-coverage-database/view/ncds.aspx"

# CMS Coverage Database search (example: digital health):
curl -sI "https://www.cms.gov/medicare-coverage-database" | grep -i "HTTP/"

# AMA CPT overview (process and category description):
curl -sI "https://www.ama-assn.org/practice-management/cpt" | grep -i "HTTP/"
```

---

## CPT Code Framework for Digital Health

### CPT Category Structure

| Category | Description | Typical Digital Health Use |
|----------|-------------|---------------------------|
| Category I | Standard codes; RVU-based reimbursement | Established care delivery services |
| Category II | Performance measurement supplemental | Tracking-only; not billed for payment |
| Category III | Emerging technology; 4-digit + T | Most digital health interventions |

### Key CPT Codes for Digital Health

#### Remote Patient Monitoring (RPM)
| Code | Description | CY2024 National Rate (approx.) |
|------|-------------|-------------------------------|
| 99453 | Initial setup and patient education (one-time) | ~$19 |
| 99454 | Device supply + daily data transmission (≥16 days/month) | ~$64/month |
| 99457 | RPM treatment management, first 20 min/month, clinical staff | ~$54/month |
| 99458 | RPM each additional 20 min/month | ~$42/month |

#### Chronic Care Management (CCM)
| Code | Description | Approx. rate |
|------|-------------|-------------|
| 99490 | CCM, first 20 min clinical staff time/month | ~$63/month |
| 99491 | CCM, physician time, first 30 min/month | ~$85/month |
| 99439 | CCM additional 20 min/month | ~$47/month |

#### Behavioral Health Integration (BHI)
| Code | Description | Approx. rate |
|------|-------------|-------------|
| 99484 | General BHI, 20 min/month | ~$49/month |
| 99492 | Initial psychiatric collaborative care, 70 min | ~$267 |

#### Digital Mental Health Treatment (DMHT) — 2024 new codes
| Code | Description |
|------|-------------|
| 98975 | DMHT initial assessment |
| 98976 | DMHT weekly data transmission + review (first device) |
| 98977 | DMHT weekly data transmission + review (musculoskeletal) |
| 98978 | DMHT weekly (cognitive behavioral therapy) |

**Note**: Rates are approximate national payment rates; actual rates vary by geography and payer. Always verify against CMS Physician Fee Schedule (PFS) for current year.

---

## CMS Coverage Determination Pathways

### National Coverage Determinations (NCD)

NCDs are issued by CMS and apply uniformly across all Medicare contractors. Coverage or non-coverage applies nationally.

- **Process**: CMS initiates → Proposed NCD → 30-day comment period → Final NCD (typically 9 months total)
- **Trigger**: CMS may act on its own initiative, or respond to a formal NCD request from a manufacturer/stakeholder
- **Search**: `https://www.cms.gov/medicare-coverage-database/view/ncds.aspx`

**Digital health-relevant NCDs**:
- NCD 30.1 — Ambulatory blood pressure monitoring (covered)
- NCD 20.31 — Ambulatory cardiac monitors (covered under specific indications)
- NCD 10.4 — Home health services (scope includes remote monitoring)

### Local Coverage Determinations (LCD)

LCDs are issued by Medicare Administrative Contractors (MACs) for their jurisdiction. Coverage may differ across MACs.

- **12 MACs** cover different geographic jurisdictions
- LCD process: MAC proposes → public comment → final LCD
- LCDs are binding within MAC jurisdiction; other MACs may follow but are not required to

**Implication for digital health**: A device or software covered by one MAC's LCD may not be covered in another region. National coverage requires either an NCD or coverage from all relevant MACs.

---

## Commercial Insurer Patterns

### "Big 3" Commercial Insurer Approach to Digital Health

| Insurer | Policy approach | Key URL pattern |
|---------|----------------|-----------------|
| UnitedHealth / Optum | Evidence-based coverage policies; tends to follow CMS with 12–18 month lag | `uhcprovider.com/content/provider/en/policies-protocols/reimbursement-policies` |
| Anthem / Elevance | Clinical criteria documents; often requires peer-reviewed RCT evidence | `anthem.com/provider/policies` |
| Aetna / CVS | Coverage Policy Bulletins; active digital health investment (Aetna Ventures) | `aetna.com/health-care-professionals/policies-guidelines` |
| Cigna | Coverage Policies; digital health-specific accelerator track | `cigna.com/healthcare-professionals/coverage-policies` |

### Prior Authorisation Likelihood Assessment

Apply this heuristic before assuming coverage:

| Scenario | Prior auth likelihood |
|----------|--------------------|
| Code is Category III (emerging) | HIGH — most commercial payers require PA |
| Code is new (< 2 years since assigned) | HIGH — insufficient real-world data |
| Clinical evidence is single RCT, no meta-analysis | MEDIUM-HIGH |
| RCT + real-world evidence + ≥2 independent replications | MEDIUM |
| Established Category I code with NCD or MAC LCD | LOW |

Use `prior-auth-review-skill` for detailed PA probability estimate by insurer.

---

## Employer Benefits Plan

US employers (self-insured plans under ERISA) have flexibility to cover digital health tools not covered by traditional Medicare/commercial. This is an accelerating access pathway.

**Key characteristics**:
- Employer decides coverage annually during open enrollment planning
- No CMS or state insurance department approval required (ERISA pre-empts state insurance law)
- Decision drivers: employee utilisation projections, ROI on health outcomes, vendor trust
- Common buyers: Benefits VPs at companies >500 employees

**Access pathway**: Partner with a health plan (for administrative services) or sell directly via a benefits broker/PBM. Pricing is typically PMPM (per member per month).

---

## J-Code Pathway (Biologics/Combination Products)

For products that include a biological component (e.g. companion diagnostics, AI-enabled lab tests):

- **HCPCS Level II J-codes**: Device/drug codes issued by CMS for outpatient use
- Application submitted to CMS; average review cycle 6–18 months
- Separate from CPT coding; used for drugs, biologics, and some durable medical equipment

---

## Workflow

### Step 1 — Identify Product Class

Is this a:
- Software as a Medical Device (SaMD)? → CPT Category III or RPM codes
- Remote monitoring service? → RPM bundle (99453–99458)
- Mental health / behavioral health app? → BHI or DMHT codes
- Combination product (device + drug)? → J-code pathway
- Consumer wellness app? → DTC/employer pathway (no Medicare coverage)

### Step 2 — Check CMS Coverage

```bash
# Search CMS NCD database for relevant condition:
curl -s "https://www.cms.gov/medicare-coverage-database/view/ncds.aspx" \
  -o /dev/null -w "%{http_code}"
# If 200: search manually for the relevant ICD code or device category
```

For the identified CPT codes, determine:
- Is there an NCD? (national coverage)
- Is there a MAC LCD? (if yes, which MACs and what region?)
- No NCD/LCD: coverage is at contractor discretion — high variance

### Step 3 — Commercial Payer Assessment

For each of the Big 3 (UHC, Anthem, Aetna):
- Check whether they follow the CMS coverage determination
- Estimate PA likelihood using the heuristic table above
- Identify any product-specific coverage policy

### Step 4 — Employer / DTC Assessment

If statutory reimbursement timeline > 2 years or evidence base is insufficient:
- Is there an employer self-insured plan opportunity?
- Is DTC pricing viable at consumer willingness-to-pay?

### Step 5 — Draft Access Strategy

Structure output per Output Format section below.

---

## Output Format

```
## US Market Access Assessment

**Product class**: [SaMD / RPM / behavioral health / combination / wellness]
**Primary CPT code(s)**: [code — description — approx. national rate]
**CMS coverage status**: [NCD covered / LCD (MAC jurisdiction) / no determination — contractor discretion]
**Commercial payer coverage**: [follow CMS / evidence-based policy / PA required / excluded]
**Prior auth likelihood**: [HIGH / MEDIUM / LOW — rationale]
**Employer/DTC pathway**: [viable / requires >N PMPM price point / not viable]
**Estimated time to first reimbursement**: [range — uncertainty driver]

### Revenue Model Options (ranked)
1. [most viable — pathway — timeline]
2. [second option — pathway — timeline]
3. [DTC/employer fallback — conditions]

### Key Evidence Requirements
- [payer X requires: evidence type]
- [payer Y requires: evidence type]

### ⚠️ Upcoming Changes
[flag any pending CMS rule changes, CPT code additions, or policy updates]

### EVIDENCE GAP
[open questions — use market-intelligence-reports skill to surface relevant payer reports]
```
