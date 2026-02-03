# Persona Visualiser

A static website for browsing persona shopping data generated from MCP Atlas mock servers. Displays order history, purchases, bookings, and other activities across multiple stores for each persona.

## Project Structure

```
persona-visualiser/
├── generator.py           # Data generation script
├── out/                   # Generated JSON data (gitignored)
├── website/               # Next.js static site
│   ├── src/
│   │   ├── app/          # App router pages
│   │   └── types/        # TypeScript interfaces
│   └── public/
│       └── data/         # JSON data copied from out/
└── CLAUDE.md             # This file
```

---

## Data Generator (`generator.py`)

The generator reads persona definitions and store order data from MCP Atlas mock servers, then outputs structured JSON files for the static website.

### Data Sources

| Source | Path | Purpose |
|--------|------|---------|
| Personas | `persona_extraction_output/shortlisted_personas.json` | Persona profiles (name, demographics, interests) |
| Store Mappings | `persona_shopping_generator/config/store_mappings.yaml` | Which stores each persona uses + keyword filters |
| Store Data | `services/agent-environment/src/agent_environment/local_servers/` | Orders, purchases, products from mock servers |

### Output Structure

```
out/
├── index.json                          # All personas + global stats
├── persona_002/
│   ├── profile.json                    # Persona details + store summary
│   └── stores/
│       ├── amazon/
│       │   ├── index.json              # Store summary + order list
│       │   └── orders/
│       │       └── ORDER-XXX.json      # Individual order details
│       └── pet_store/
│           ├── index.json              # Multi-category store
│           └── orders/
│               ├── PUR-XXX.json        # Purchase details
│               ├── GRM-XXX.json        # Grooming appointment
│               └── PET-XXX.json        # Pet profile
└── ...
```

### Store Categories

Stores can have single or multiple data categories:

| Store | Categories |
|-------|------------|
| Amazon, Walmart | orders |
| Bakery | purchases, preorders |
| Coffee Roaster | purchases, subscriptions |
| Pet Store | purchases, grooming, pets |
| Florist | orders, subscriptions |
| Zillow | tours, saved |
| Car Deals | inquiries, test_drives |
| Movie Theater | bookings |

### Transaction Types

Each category has a transaction type that determines display behavior:

| Type | Label | Has Cost | Example |
|------|-------|----------|---------|
| `orders` | orders | Yes | Amazon orders |
| `purchases` | purchases | Yes | Bakery purchases |
| `bookings` | bookings | Yes | Movie tickets |
| `subscriptions` | subscriptions | Yes | Coffee subscription |
| `grooming` | appointments | Yes | Pet grooming |
| `preorders` | preorders | Yes | Custom cake orders |
| `tours` | tours | No | Zillow property tours |
| `saved` | saved properties | No | Zillow favorites |
| `inquiries` | activities | No | Car inquiries |
| `pets` | pets | No | Pet profiles |
| `wishlists` | wishlist items | No | Toy wishlists |

### Processing Functions

Each transaction type has a dedicated processing function:

| Function | Handles |
|----------|---------|
| `process_orders_store()` | Orders with order_items.csv |
| `process_florist_orders()` | Florist orders (embedded items) |
| `process_purchases_store()` | Simple purchases (bakery, pharmacy, etc.) |
| `process_bookings_store()` | Movie theater bookings |
| `process_zillow()` | Property tours |
| `process_zillow_saved()` | Saved properties |
| `process_car_deals()` | Inquiries and test drives |
| `process_florist_subscriptions()` | Florist subscriptions |
| `process_coffee_subscriptions()` | Coffee subscriptions |
| `process_pet_grooming()` | Grooming appointments |
| `process_pet_profiles()` | Pet profiles |
| `process_toy_wishlists()` | Toy store wishlists |
| `process_bakery_preorders()` | Custom cake preorders |

### Product ID Field Names

Different stores use different field names for product IDs. The generator handles:

**Orders (order_items.csv):**
- `asin` (Amazon)
- `product_id` (most stores)
- `item_id`
- `perfume_id` (Perfume Shop)

**Purchases (purchases.csv):**
- `product_id` (most stores)
- `book_id` (Bookstore)
- `medicine_id` (Pharmacy)
- `bean_id` (Coffee Roaster)

### Display Fields

Items in list views use these optional fields for better display:

| Field | Purpose | Example |
|-------|---------|---------|
| `display_name` | Primary display text | "Wicked" (movie), "Whiskers" (pet) |
| `description` | Secondary info | "3 seats", "Persian (Cat)" |
| `item_preview` | First 2 items of order | "Catch-22, Hamilton Beach Kettle, ..." |

### Running the Generator

```bash
# From persona-visualiser directory
uv run --with pyyaml python generator.py

# Copy to website
cp -r out/* website/public/data/
```

---

## Static Website (`website/`)

A Next.js 15 static site with App Router, configured for static export.

### Tech Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Static Export** (`output: "export"` in next.config.ts)
- **CSS Variables** for theming (dark mode default)

### Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `app/page.tsx` | Persona list with search/filter |
| `/persona/[personaId]` | `app/persona/[personaId]/page.tsx` | Persona profile + store list |
| `/persona/[personaId]/store/[storeId]` | `app/persona/.../store/[storeId]/page.tsx` | Store activity list |
| `/persona/[personaId]/store/[storeId]/order/[orderId]` | `app/.../order/[orderId]/page.tsx` | Order/item details |

### Type Definitions (`types/index.ts`)

Key interfaces:

```typescript
interface PersonaSummary {
  id: string;
  name: string;
  initials: string;
  profession: string;
  // ...
}

interface ItemSummary {
  order_id: string;
  display_name?: string;    // For pets, movies, properties
  description?: string;     // Additional context
  item_preview?: string;    // First 2 items preview
  status: string;
  total: number;
  item_count: number;
  created_at: string;
}

interface StoreCategory {
  id: string;
  name: string;
  type: string;
  has_cost: boolean;
  summary: { total_count, total_spent, first_date, last_date };
  items: ItemSummary[];
}

interface StoreIndex {
  persona_id: string;
  store_id: string;
  store_name: string;
  transaction_type: string;
  has_cost: boolean;
  summary: { ... };
  categories: StoreCategory[];  // All stores use categories
}
```

### Component: CategorySection

The unified component for displaying item lists (used for both single and multi-category stores):

```tsx
function CategorySection({ category, personaId, storeId }) {
  // Renders category header with count/total
  // Renders item list with smart display:
  //   - display_name → show as title (movies, pets, properties)
  //   - item_preview → show as title (orders with items)
  //   - fallback → show order_id as title
}
```

### Display Logic Priority

1. **Has `display_name`**: Show display_name as title, description as subtitle
2. **Has `item_preview`**: Show item_preview as title, order_id + date as subtitle
3. **Fallback**: Show order_id as title, date as subtitle

### Running the Website

```bash
cd website

# Development
npm run dev

# Build static site
npm run build

# Output in website/out/
```

### Static Generation

All pages use `generateStaticParams()` to pre-render at build time:

```typescript
export async function generateStaticParams() {
  // Read index.json to get all persona IDs
  // Read each profile.json to get store IDs
  // Return all valid route combinations
}
```

---

## Adding New Store Support

### 1. Update Generator

1. Add store to `STORE_NAMES` dict
2. Add category config to `STORE_CATEGORIES`
3. Add product file mapping to `load_products()`
4. If new transaction type, add to `TRANSACTION_TYPE_LABELS`
5. If new data structure, create processing function
6. Update `process_category()` to route to new function

### 2. Handle Product ID Fields

If the store uses a unique field name for product IDs:

**For orders (order_items.csv):**
```python
# In process_orders_store()
prod_id = (item.get("asin") or item.get("product_id") or
          item.get("your_new_field") or "")
```

**For purchases (purchases.csv):**
```python
# In process_purchases_store()
prod_id = (purchase.get("product_id") or purchase.get("book_id") or
          purchase.get("your_new_field") or "")
```

### 3. Add Display Fields

For better list view display, add `display_name` and `description`:

```python
summaries.append({
    "order_id": f"PREFIX-{item_id}",
    "display_name": meaningful_title,      # e.g., movie name, pet name
    "description": additional_context,      # e.g., "3 seats", breed
    "status": status,
    "total": total,
    "item_count": count,
    "created_at": created_at,
})
```

---

## Common Tasks

### Regenerate All Data

```bash
cd persona-visualiser
uv run --with pyyaml python generator.py
cp -r out/* website/public/data/
```

### Add New Persona

1. Add persona to `persona_extraction_output/shortlisted_personas.json`
2. Add store mappings to `persona_shopping_generator/config/store_mappings.yaml`
3. Generate persona order data using persona_shopping_generator
4. Regenerate visualiser data

### Debug Missing Product Names

If products show as "Product XXX" instead of names:

1. Check the store's CSV for the product ID field name
2. Add the field name to the appropriate processing function
3. Verify `load_products()` is loading the correct file with correct field mappings

---

## Standalone Repository

The website and data are also available as a standalone repo at `~/persona-visualiser-standalone/` for sharing without the full MCP Atlas codebase.

### Sync Changes to Standalone Repo

After making changes to the website or regenerating data:

```bash
# 1. Regenerate data (if needed)
cd /Users/pratyush.singhal/mcp-atlas/persona-visualiser
uv run --with pyyaml python generator.py
cp -r out/* website/public/data/

# 2. Sync website code (excluding node_modules, build artifacts, and .git)
rsync -av --delete \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='out' \
  --exclude='.git' \
  /Users/pratyush.singhal/mcp-atlas/persona-visualiser/website/ \
  ~/persona-visualiser-standalone/

# 3. Copy updated documentation
cp /Users/pratyush.singhal/mcp-atlas/persona-visualiser/CLAUDE.md \
  ~/persona-visualiser-standalone/

# 4. Commit and push
cd ~/persona-visualiser-standalone
git add .
git commit -m "Sync changes from mcp-atlas"
git push
```

### One-liner Sync Script

```bash
# Full sync: regenerate data + sync website + commit
cd /Users/pratyush.singhal/mcp-atlas/persona-visualiser && \
uv run --with pyyaml python generator.py && \
cp -r out/* website/public/data/ && \
rsync -av --delete --exclude='node_modules' --exclude='.next' --exclude='out' --exclude='.git' \
  website/ ~/persona-visualiser-standalone/ && \
cp CLAUDE.md ~/persona-visualiser-standalone/ && \
cd ~/persona-visualiser-standalone && \
git add . && git commit -m "Sync: $(date '+%Y-%m-%d %H:%M')" && git push
```

### What Gets Synced

| Source | Destination | Notes |
|--------|-------------|-------|
| `website/src/` | `~/persona-visualiser-standalone/src/` | App code |
| `website/public/data/` | `~/persona-visualiser-standalone/public/data/` | Generated JSON |
| `website/*.json`, `*.ts`, `*.mjs` | `~/persona-visualiser-standalone/` | Config files |
| `CLAUDE.md` | `~/persona-visualiser-standalone/CLAUDE.md` | Documentation |

### What's Excluded

- `node_modules/` - Reinstall with `npm install`
- `.next/` - Build artifacts
- `out/` - Static export output
- `.git/` - Preserve standalone repo's git history
