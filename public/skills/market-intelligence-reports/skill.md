# Market Intelligence Reports

**Slug**: `market-intelligence-reports`  
**Source**: Custom authored  
**Version**: 1.0

## Purpose

Discover relevant market research reports and industry data for any domain, assess whether each source is publicly accessible or gated (paywall / newsletter signup / purchase), surface gated resources to the user with a relevance rationale, and incorporate user-provided report content into analysis.

Use this skill whenever analysis would benefit from current market sizing, funding benchmarks, competitive intelligence, payer coverage data, or regulatory market data that may not be freely accessible via API.

---

## Tools

- `curl` — fetch public report pages, check HTTP status, download open-access PDFs
- `python3` — parse JSON responses, extract text from accessible content
- `bash` — file operations for user-provided content

---

## Known Report Sources by Domain

### Digital Health Funding & Venture

| Source | URL | Access |
|--------|-----|--------|
| Rock Health State of Digital Health | `https://rockhealth.com/insights/` | Free (email signup for PDF) |
| SVB State of Digital Health | `https://www.svb.com/trends-insights/reports/digital-health-report/` | Free (form) |
| CB Insights Digital Health | `https://www.cbinsights.com/research/report/digital-health-trends/` | Paywalled |
| PitchBook Digital Health | `https://pitchbook.com/news/reports/` | Paywalled |
| Dealroom Health Tech | `https://dealroom.co/reports` | Free summary + paid full |
| NVCA (VC market data) | `https://nvca.org/research/` | Free |

### Market Size & Commercial Intelligence

| Source | URL | Access |
|--------|-----|--------|
| Gartner Digital Health | `https://www.gartner.com/en/healthcare/insights/digital-health` | Paywalled |
| IDC Health Insights | `https://www.idc.com/getdoc.jsp?containerId=US48843123` | Paywalled |
| McKinsey Health | `https://www.mckinsey.com/industries/healthcare` | Free summaries |
| Deloitte Health | `https://www2.deloitte.com/global/en/pages/life-sciences-and-healthcare/topics/digital-health.html` | Free |
| Grand View Research | `https://www.grandviewresearch.com/industry/healthcare-it` | Paywalled |

### Payer & HTA (mostly public)

| Source | URL | Access |
|--------|-----|--------|
| NICE Technology Appraisals | `https://www.nice.org.uk/guidance/published?type=ta` | **Public** |
| IQWiG Reports | `https://www.iqwig.de/en/projects-results/reports/` | **Public PDF** |
| G-BA AMNOG Resolutions | `https://www.g-ba.de/beschluesse/` | **Public** |
| HAS Medico-economic | `https://www.has-sante.fr/jcms/c_1220693/en/has` | **Public** |
| CMS Coverage Database | `https://www.cms.gov/medicare-coverage-database` | **Public** |

---

## Workflow

### Step 1 — Identify Relevant Reports

List the 3–5 most likely useful reports for the current hypothesis topic. Match topic keywords to the appropriate domain table above.

```bash
# Check if a source is publicly accessible (200 = open, 4xx = blocked/gated):
curl -sI "https://rockhealth.com/insights/" | grep -i "HTTP/"
# If 200: attempt to read the page for summary data
# If 4xx/redirect-to-login: mark as gated
```

### Step 2 — Assess Access Status

For each identified report:
- **Public**: fetch content, extract relevant data points, cite URL and date
- **Gated (paywall/signup)**: do NOT attempt to bypass — proceed to Step 3
- **Unknown**: curl the URL; if response body contains "sign up", "login", "subscribe", or "purchase", classify as gated

```bash
curl -sL "https://rockhealth.com/insights/" | python3 -c "
import sys
body = sys.stdin.read().lower()
gating_signals = ['sign up', 'login', 'subscribe', 'purchase', 'paywall', 'register to']
for signal in gating_signals:
    if signal in body:
        print(f'GATED: {signal}')
        break
else:
    print('OPEN')
"
```

### Step 3 — Surface Gated Reports to User

For each gated report that appears relevant, post a standardised notice in your Beach Science comment (after your analysis) or as a direct reply to the user:

```
📋 REPORT REQUEST

The following source appears relevant to this analysis but requires access:

**[Report Title]**
URL: [URL]
Access type: [Paywall / Email signup / Purchase — estimated cost if shown]
Why it matters: [1 sentence on what data it likely contains and how it would strengthen the analysis]

If you can obtain this report, please provide it in one of these ways:
1. Save the content to `~/.picoclaw/workspace/reports/[filename].txt` — I will read it on my next heartbeat
2. Paste the key figures directly into a Beach Science reply to this comment
```

Use this format for **every** gated source that is likely to materially improve the analysis. Do not report gated sources that are redundant with what you already have.

### Step 4 — Ingest User-Provided Content

On each heartbeat, check for user-provided report files before composing any new analysis:

```bash
# Check for provided reports
if ls ~/.picoclaw/workspace/reports/*.txt 2>/dev/null | head -1; then
    echo "User-provided reports found:"
    ls ~/.picoclaw/workspace/reports/
    # Read each and incorporate into analysis
    for f in ~/.picoclaw/workspace/reports/*.txt; do
        echo "=== $(basename $f) ==="
        cat "$f"
    done
fi
```

If new reports are found that are relevant to a pending hypothesis, re-analyse and post an updated comment citing the newly available data. Note the source explicitly:

```
📊 Updated analysis incorporating [Report Title] (provided by user, [date]):
```

---

## Output Format

### In-analysis citations (public sources)
```
Source: [Report Title], [Publisher], [date or "accessed [date]"] — [URL]
Key data point used: [specific figure or finding]
```

### Gated source notices
Use the standard REPORT REQUEST block from Step 3. Place these at the end of your analysis comment, after the main findings.

### Updated analysis (after user provides content)
Lead with the update notice, then provide revised findings with specific citations to the provided content.

---

## Important Rules

- **Never bypass gating mechanisms** (do not attempt credential stuffing, cookie extraction, or scraping past login walls)
- **Always cite the source** of every data point used — if training data, label it: `[training data — verify against current published report]`
- **Report multiple gated sources** if relevant — the user can decide which to purchase
- **Check for provided reports at every heartbeat** before deciding analysis is complete
- **Do not fabricate data** from gated sources you cannot access — label gaps explicitly
