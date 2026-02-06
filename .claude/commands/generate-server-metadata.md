Regenerate `public/data/server-metadata.json` from the tool definition files.

## Steps

1. **Read tool definition files:**
   - `public/data/shopping-tools.json`
   - `public/data/healthcare-tools.json`

2. **Read the existing metadata file** (if it exists):
   - `public/data/server-metadata.json`

3. **For each tool file**, group tools by server ID (prefix before the first `_` in the tool name, e.g. `amazon-shop_get-orders` → `amazon-shop`). For each server, collect all tool names and their descriptions.

4. **For each server**, generate a descriptive summary based on its tools:
   - Read every tool's name and description to understand what the server provides
   - Write a 1-2 sentence summary (aim for 100-180 chars) that tells a user what the server does and what data/actions it exposes
   - Be specific about the domain and key capabilities — mention notable features, not just generic categories
   - For niche/specialized servers (especially in healthcare), explain what the tool actually is so non-experts can understand

5. **Merge with existing metadata:**
   - If a server already has a summary in the existing file, **keep it** unless the tool set has meaningfully changed (new tools added, tools removed, or purpose shifted)
   - Add summaries for any **new servers** not in the existing file
   - Remove entries for servers that **no longer exist** in the tool files

6. **Write the result** to `public/data/server-metadata.json` with this structure:

```json
{
  "shopping": {
    "amazon-shop": {
      "summary": "Full Amazon shopping experience with product search, cart management, order history, and checkout"
    }
  },
  "medical": {
    "fitbit": {
      "summary": "Fitbit wearable data — steps, distance, calories, heart rate, sleep stages, body measurements, food/water logs, active zone minutes, and lifetime stats"
    }
  }
}
```

## Category mapping

| Tool file | Category key |
|-----------|-------------|
| `shopping-tools.json` | `"shopping"` |
| `healthcare-tools.json` | `"medical"` |

If new tool files are added in the future, extend this mapping.

## Summary writing guidelines

- **Be descriptive, not generic.** "Pharmacy with medicines searchable by ailment, ingredient, or category" is better than "Pharmacy — medicines & orders"
- **Explain niche tools.** "DeepMind's AlphaFold protein structure predictions — search, download, confidence analysis, batch processing, and export for PyMOL/ChimeraX" tells the user what AlphaFold is
- **Mention key differentiating features.** If a bakery has custom cake pricing, dietary filters, and pre-orders, mention those — not just "bakery products"
- **For wearables/health devices**, list the specific data types available (steps, HRV, sleep stages, etc.)
- **For research/biomedical tools**, name the underlying databases or APIs (PubMed, ClinicalTrials.gov, MyGene.info, etc.)
- **For utility servers** (calculator, search engines), keep it short — these are self-explanatory
- Use plain language a non-technical user can understand
- Write the JSON file with 2-space indentation
