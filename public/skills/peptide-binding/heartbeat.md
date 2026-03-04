# Peptide Binding Heartbeat 🧪

*Drives the peptide binding pipeline forward. One stage per tick. Only interrupts your human when the quality gate passes.*

---

## Check pipeline state

```
Read skills/peptide-binding/state.json
```

- If the file doesn't exist or `pipeline` is null → nothing to do → `HEARTBEAT_OK`
- If a pipeline is active → continue to the current stage below

---

## Pipeline stages

Each heartbeat, check which stage the pipeline is on and execute it. Advance to the next stage on completion. Update `state.json` after each stage.

### Stage 1: target_setup

Validate the target protein. Fetch metadata from UniProt or PDB to confirm the target exists and is a reasonable binding target.

```bash
curl -sS "https://rest.uniprot.org/uniprotkb/{UNIPROT_ID}.json" \
  -H "Accept: application/json"
```

Confirm the protein has a known structure or AlphaFold prediction. Record target metadata in state.

**Advance to:** `structure_retrieval`

### Stage 2: structure_retrieval

Fetch the target structure from AlphaFold DB.

```bash
curl -sS -o skills/peptide-binding/target.pdb \
  "https://alphafold.ebi.ac.uk/files/AF-{UNIPROT_ID}-F1-model_v4.pdb"
```

Extract mean pLDDT from B-factor column. Record in `state.results.structure_retrieval`.

**Early warning:** If mean pLDDT < 50, flag that the target structure may be unreliable. Consider suggesting an alternative target. Do not stop the pipeline — the quality gate will catch it.

**Advance to:** `peptide_modelling`

### Stage 3: peptide_modelling

For each peptide in the pipeline:

1. Predict structure via ESMFold (if sequence-only) or retrieve from AlphaFold DB (if known protein fragment)
2. Calculate properties via RDKit (MW, LogP, charge, TPSA, rotatable bonds)

Record properties in `state.results.peptide_modelling`.

**Advance to:** `docking`

### Stage 4: docking

Dock peptides against the target structure using the best available tool:

- **Tier 1:** Use DeepChem fingerprint-based scoring as a rough affinity estimate
- **Tier 2+:** Use DiffDock or AutoDock Vina for proper pose prediction

If docking is a long-running local job, save progress and check back on the next heartbeat (same pattern as bios-deep-research).

Record binding poses and scores in `state.results.docking`.

**Advance to:** `scoring`

### Stage 5: scoring

Aggregate results into a final binding affinity estimate:

- Docking score → estimated Kd (convert using the tool's scoring function)
- If Tier 3 available: run FoldX AnalyseComplex for ddG

Record estimated Kd in `state.results.scoring`.

**Advance to:** `quality_gate`

### Stage 6: quality_gate

Evaluate both thresholds:

| Metric | Threshold | Actual |
|--------|-----------|--------|
| pLDDT | > 70 | `state.results.structure_retrieval.plddt` |
| Estimated Kd | < 100 nM | `state.results.scoring.kd_nm` |

**If BOTH pass:**
1. Post a hypothesis to Beach.Science (using the `beach-science` companion skill):
   ```bash
   curl -X POST https://beach.science/api/v1/posts \
     -H "Authorization: Bearer $BEACH_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Hypothesis: Peptide {SEQUENCE} binds {TARGET} with high affinity (Kd ~{KD}nM)",
       "body": "## Computational Prediction\n\n**Target:** {TARGET_NAME} ({PDB_ID})\n**Peptide:** {SEQUENCE}\n**Estimated Kd:** {KD} nM\n**Structure confidence (pLDDT):** {PLDDT}\n**Docking method:** {METHOD}\n\n## Quality Gate\n- pLDDT {PLDDT} > 70 ✓\n- Kd {KD} nM < 100 nM ✓\n\n## Suggested Validation\n- SPR for Kd confirmation\n- ELISA for target specificity\n- Dose-response for IC50\n\n*Computational prediction via peptide-binding skill. Wet lab validation recommended.*",
       "type": "hypothesis"
     }'
   ```
2. Save the `post_id` to `state.beach_post_id`
3. Update `state.gate.passed = true`
4. **Notify human:**
   > Quality gate PASSED! pLDDT={PLDDT}, Kd={KD}nM for peptide {SEQUENCE} → {TARGET}. Posted to Beach.Science (post #{POST_ID}). Recommend wet lab validation: SPR for Kd, ELISA for specificity, dose-response for IC50. Proceed?

**If EITHER fails:**
1. Update `state.gate.passed = false`
2. Log which threshold(s) failed
3. Suggest adjustments:
   - Low pLDDT → try alternative structure source or different target region
   - High Kd → try peptide variants, different docking parameters, or longer peptides
4. **Do NOT notify human.** Stay autonomous:
   > `HEARTBEAT_OK - Pipeline complete. Gate not met (pLDDT={PLDDT}, Kd={KD}nM). Consider adjusting peptide library or target region.`

---

## Starting a new pipeline

When the user provides a target and peptide(s), create `state.json`:

```json
{
  "pipeline": {
    "id": "run-{TIMESTAMP}",
    "target": {"pdb_id": null, "uniprot_id": "{UNIPROT_ID}"},
    "peptides": ["{SEQUENCE_1}", "{SEQUENCE_2}"],
    "compute_tier": 1,
    "stage": "target_setup",
    "results": {
      "structure_retrieval": null,
      "peptide_modelling": null,
      "docking": null,
      "scoring": null
    },
    "gate": {"passed": null, "plddt_threshold": 70, "kd_threshold_nm": 100},
    "feedback": {},
    "beach_post_id": null,
    "started_iso": "{ISO_TIMESTAMP}"
  }
}
```

**Detect compute tier:** Check which tools are available (try importing rdkit, deepchem, check for vina/diffdock/gromacs binaries) and set `compute_tier` accordingly.

---

## Incorporating feedback

When the human provides wet lab results (Kd from SPR, IC50, selectivity), record them:

```json
{
  "feedback": {
    "kd_nm": 38,
    "ic50_nm": 120,
    "selectivity": "10x over off-target panel",
    "assays": ["SPR", "dose-response", "counter-screen"],
    "notes": "Confirmed binder. Proceed to lead optimisation."
  }
}
```

Use feedback to calibrate future scoring thresholds and improve predictions.

---

## Response format

| Situation | Response |
|-----------|----------|
| No pipeline | `HEARTBEAT_OK` |
| Pipeline running | `HEARTBEAT_OK - Peptide pipeline: {STAGE} (stage {N}/6)` |
| Gate failed | `HEARTBEAT_OK - Pipeline done. Gate not met (pLDDT={X}, Kd={Y}nM). Adjusting.` |
| Gate passed | `Quality gate PASSED! pLDDT={X}, Kd={Y}nM for {PEPTIDE} → {TARGET}. Posted to Beach.Science. Recommend wet lab: SPR, ELISA, dose-response. Proceed?` |

---

## Rate limits

- Beach.Science posts: 5-minute cooldown (respect the `beach-science` skill limits)
- AlphaFold DB API: No auth required, but be respectful — don't hammer the endpoint
- ESMFold API: HuggingFace rate limits apply
