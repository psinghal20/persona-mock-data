#!/usr/bin/env python3
"""
Persona Visualiser Data Generator

Generates JSON data files for the persona visualisation website from
existing persona definitions and store order data.

Output structure:
    out/
    ├── index.json                      # All personas + stats
    ├── persona_002/
    │   ├── profile.json                # Persona details + store summary
    │   └── stores/
    │       ├── amazon/
    │       │   ├── index.json          # Orders list
    │       │   └── orders/
    │       │       └── ORDER-XXX.json  # Order details
    │       └── ...
    └── ...
"""

import csv
import json
import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import yaml

# Paths
BASE_DIR = Path(__file__).parent.parent
PERSONAS_FILE = BASE_DIR / "persona_extraction_output" / "shortlisted_personas.json"
STORE_MAPPINGS_FILE = BASE_DIR / "persona_shopping_generator" / "config" / "store_mappings.yaml"
LOCAL_SERVERS_DIR = BASE_DIR / "services" / "agent-environment" / "src" / "agent_environment" / "local_servers"
OUTPUT_DIR = Path(__file__).parent / "out"


# Store display names
STORE_NAMES = {
    "amazon": "Amazon",
    "walmart": "Walmart",
    "pc_parts": "PC Parts",
    "electronics_store": "Electronics Store",
    "bakery": "Bakery",
    "grocery": "Grocery",
    "coffee_roaster": "Coffee Roaster",
    "fashion": "Fashion",
    "sephora": "Sephora",
    "perfume_shop": "Perfume Shop",
    "jewelry_store": "Jewelry Store",
    "sporting_goods": "Sporting Goods",
    "toy_store": "Toy Store",
    "pet_store": "Pet Store",
    "pharmacy": "Pharmacy",
    "furniture_store": "Furniture Store",
    "florist": "Florist",
    "zillow": "Zillow",
    "car_deals": "Car Deals",
    "bookstore": "Bookstore",
    "movie_theater": "Movie Theater",
}

# Transaction type labels for UI display
TRANSACTION_TYPE_LABELS = {
    "orders": {"singular": "order", "plural": "orders", "has_cost": True},
    "purchases": {"singular": "purchase", "plural": "purchases", "has_cost": True},
    "bookings": {"singular": "booking", "plural": "bookings", "has_cost": True},
    "tours": {"singular": "tour", "plural": "tours", "has_cost": False},
    "inquiries": {"singular": "inquiry", "plural": "inquiries", "has_cost": False},
    "test_drives": {"singular": "test drive", "plural": "test drives", "has_cost": False},
    "subscriptions": {"singular": "subscription", "plural": "subscriptions", "has_cost": True},
    "grooming": {"singular": "appointment", "plural": "appointments", "has_cost": True},
    "pets": {"singular": "pet", "plural": "pets", "has_cost": False},
    "preorders": {"singular": "preorder", "plural": "preorders", "has_cost": True},
    "wishlists": {"singular": "wishlist item", "plural": "wishlist items", "has_cost": False},
    "saved": {"singular": "saved property", "plural": "saved properties", "has_cost": False},
}

# Store categories - each store can have multiple data categories
# Primary category is used for summary stats; additional categories are also displayed
STORE_CATEGORIES = {
    # Orders-based stores (single category)
    "amazon": [
        {"id": "orders", "name": "Orders", "type": "orders", "file": "orders.csv", "items_file": "order_items.csv", "primary": True},
    ],
    "walmart": [
        {"id": "orders", "name": "Orders", "type": "orders", "file": "orders.csv", "items_file": "order_items.csv", "primary": True},
    ],
    "pc_parts": [
        {"id": "orders", "name": "Orders", "type": "orders", "file": "orders.csv", "items_file": "order_items.csv", "primary": True},
    ],
    "electronics_store": [
        {"id": "orders", "name": "Orders", "type": "orders", "file": "orders.csv", "items_file": "order_items.csv", "primary": True},
    ],
    "fashion": [
        {"id": "orders", "name": "Orders", "type": "orders", "file": "orders.csv", "items_file": "order_items.csv", "primary": True},
    ],
    "sephora": [
        {"id": "orders", "name": "Orders", "type": "orders", "file": "orders.csv", "items_file": "order_items.csv", "primary": True},
    ],
    "perfume_shop": [
        {"id": "orders", "name": "Orders", "type": "orders", "file": "orders.csv", "items_file": "order_items.csv", "primary": True},
    ],
    "jewelry_store": [
        {"id": "orders", "name": "Orders", "type": "orders", "file": "orders.csv", "items_file": "order_items.csv", "primary": True},
    ],
    "sporting_goods": [
        {"id": "orders", "name": "Orders", "type": "orders", "file": "orders.csv", "items_file": "order_items.csv", "primary": True},
    ],
    "toy_store": [
        {"id": "orders", "name": "Orders", "type": "orders", "file": "orders.csv", "items_file": "order_items.csv", "primary": True},
        {"id": "wishlists", "name": "Wishlists", "type": "wishlists", "file": "wishlists.csv", "primary": False},
    ],
    "furniture_store": [
        {"id": "orders", "name": "Orders", "type": "orders", "file": "orders.csv", "items_file": "order_items.csv", "primary": True},
    ],
    "grocery": [
        {"id": "orders", "name": "Orders", "type": "orders", "file": "orders.csv", "items_file": "order_items.csv", "primary": True},
    ],
    # Multi-category stores
    "florist": [
        {"id": "orders", "name": "Orders", "type": "orders", "file": "orders.csv", "items_file": "order_items.csv", "primary": True},
        {"id": "subscriptions", "name": "Subscriptions", "type": "subscriptions", "file": "subscriptions.csv", "primary": False},
    ],
    "bakery": [
        {"id": "purchases", "name": "Purchases", "type": "purchases", "file": "purchases.csv", "primary": True},
        {"id": "preorders", "name": "Custom Cake Preorders", "type": "preorders", "file": "preorders.csv", "primary": False},
    ],
    "coffee_roaster": [
        {"id": "purchases", "name": "Purchases", "type": "purchases", "file": "purchases.csv", "primary": True},
        {"id": "subscriptions", "name": "Subscriptions", "type": "subscriptions", "file": "user_subscriptions.csv", "primary": False},
    ],
    "pet_store": [
        {"id": "purchases", "name": "Purchases", "type": "purchases", "file": "purchases.csv", "primary": True},
        {"id": "grooming", "name": "Grooming Appointments", "type": "grooming", "file": "grooming_appointments.csv", "primary": False},
        {"id": "pets", "name": "Pet Profiles", "type": "pets", "file": "pet_profiles.csv", "primary": False},
    ],
    # Other purchases-based stores
    "pharmacy": [
        {"id": "purchases", "name": "Purchases", "type": "purchases", "file": "purchases.csv", "primary": True},
    ],
    "bookstore": [
        {"id": "purchases", "name": "Purchases", "type": "purchases", "file": "purchases.csv", "primary": True},
    ],
    # Bookings-based stores
    "movie_theater": [
        {"id": "bookings", "name": "Bookings", "type": "bookings", "file": "bookings.csv", "primary": True},
    ],
    # Special stores
    "zillow": [
        {"id": "tours", "name": "Scheduled Tours", "type": "tours", "file": "scheduled_tours.csv", "primary": True},
        {"id": "saved", "name": "Saved Properties", "type": "saved", "file": "saved_properties.csv", "primary": False},
    ],
    "car_deals": [
        {"id": "inquiries", "name": "Inquiries", "type": "inquiries", "file": "inquiries.csv", "primary": True},
        {"id": "test_drives", "name": "Test Drives", "type": "test_drives", "file": "test_drive_bookings.csv", "primary": False},
    ],
}

# Legacy mapping for backward compatibility (used by some functions)
STORE_TRANSACTION_TYPES = {
    store_id: next((cat for cat in cats if cat.get("primary")), cats[0])
    for store_id, cats in STORE_CATEGORIES.items()
}


def load_personas() -> list[dict]:
    """Load persona definitions from JSON file."""
    with open(PERSONAS_FILE) as f:
        data = json.load(f)
    return data["personas"]


def load_store_mappings() -> dict:
    """Load store mappings from YAML file."""
    with open(STORE_MAPPINGS_FILE) as f:
        data = yaml.safe_load(f)
    return data["personas"]


def load_csv(filepath: Path) -> list[dict]:
    """Load a CSV file and return list of dicts."""
    if not filepath.exists():
        return []
    with open(filepath, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)


def load_products(store_id: str) -> dict[str, dict]:
    """Load product catalog for a store, returning dict keyed by product ID."""
    store_dir = LOCAL_SERVERS_DIR / store_id / "data"
    products = {}

    # Different stores have different product files/structures
    product_files = {
        "amazon": ("products.csv", "asin", "title"),
        "walmart": ("products.csv", "product_id", "name"),
        "pc_parts": None,  # Multiple files
        "electronics_store": ("products.csv", "id", "name"),
        "fashion": ("products.csv", "id", "name"),
        "sephora": ("products.csv", "product_id", "name"),
        "perfume_shop": ("perfumes.csv", "id", "name"),
        "jewelry_store": ("products.csv", "id", "name"),
        "sporting_goods": ("products.csv", "id", "name"),
        "toy_store": ("products.csv", "id", "name"),
        "furniture_store": ("products.csv", "id", "name"),
        "florist": ("arrangements.csv", "id", "name"),
        "grocery": ("products.csv", "id", "name"),
        "bakery": ("products.csv", "id", "name"),
        "coffee_roaster": ("beans.csv", "id", "name"),
        "pet_store": ("products.csv", "id", "name"),
        "pharmacy": ("medicines.csv", "id", "name"),
        "bookstore": ("books.csv", "id", "title"),
        "movie_theater": ("movies.csv", "id", "title"),
        "zillow": ("properties.csv", "id", "address"),
        "car_deals": ("listings.csv", "id", "model"),
    }

    if store_id == "pc_parts":
        # PC parts has multiple category files
        for cat_file in ["cpus.csv", "gpus.csv", "ram.csv", "ssds.csv",
                         "motherboards.csv", "psus.csv", "cases.csv"]:
            filepath = store_dir / cat_file
            if filepath.exists():
                for row in load_csv(filepath):
                    prod_id = row.get("id", "")
                    products[prod_id] = {
                        "id": prod_id,
                        "name": row.get("name", row.get("model", "Unknown")),
                        "category": cat_file.replace(".csv", ""),
                        "brand": row.get("brand", ""),
                        "price": row.get("price", "0"),
                    }
    elif store_id in product_files and product_files[store_id]:
        filename, id_field, name_field = product_files[store_id]
        filepath = store_dir / filename
        if filepath.exists():
            for row in load_csv(filepath):
                prod_id = row.get(id_field, "")
                products[prod_id] = {
                    "id": prod_id,
                    "name": row.get(name_field, "Unknown"),
                    "category": row.get("category", row.get("genre", "")),
                    "brand": row.get("brand", ""),
                    "price": row.get("price", "0"),
                }

    return products


def get_initials(name: str) -> str:
    """Generate initials from a name."""
    parts = name.split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return name[:2].upper()


def get_item_preview(items: list[dict], max_items: int = 2) -> Optional[str]:
    """Generate a preview string showing the first few items."""
    if not items:
        return None
    names = [item.get("name", "Item") for item in items[:max_items]]
    preview = ", ".join(names)
    # Add ellipsis if there are more items
    if len(items) > max_items:
        preview += ", ..."
    return preview


def get_order_id_field(row: dict) -> str:
    """Get the order ID from a row, handling different column names."""
    return row.get("order_id") or row.get("id") or ""


def get_date_field(row: dict) -> str:
    """Get the date from a row, handling different column names."""
    return (row.get("created_at") or row.get("purchased_at") or
            row.get("date") or row.get("scheduled_time") or "")


def get_total_field(row: dict) -> float:
    """Get the total from a row, handling different column names."""
    total_str = row.get("total") or row.get("total_price") or "0"
    try:
        return float(total_str)
    except (ValueError, TypeError):
        return 0.0


def process_florist_orders(
    store_id: str,
    persona_id: str,
    products: dict[str, dict]
) -> tuple[list[dict], list[dict]]:
    """Process florist orders which have embedded arrangement_id and addons."""
    store_dir = LOCAL_SERVERS_DIR / store_id / "data"
    orders_file = store_dir / "orders.csv"

    if not orders_file.exists():
        return [], []

    all_orders = load_csv(orders_file)
    persona_orders = [o for o in all_orders if o.get("user_id") == persona_id]

    order_summaries = []
    order_details = []

    for order in persona_orders:
        order_id = order.get("id", "")
        created_at = order.get("created_at", "")
        total = float(order.get("total_price", 0))
        status = order.get("status", "unknown")

        # Get arrangement
        arrangement_id = order.get("arrangement_id", "")
        arrangement = products.get(arrangement_id, {})

        items_detail = []

        # Add the main arrangement
        if arrangement:
            arr_price = float(arrangement.get("price", 0))
            items_detail.append({
                "product_id": arrangement_id,
                "name": arrangement.get("name", f"Arrangement {arrangement_id}"),
                "category": arrangement.get("category", "Arrangement"),
                "quantity": 1,
                "price": arr_price,
                "subtotal": arr_price,
            })

        # Parse addons JSON
        addons_str = order.get("addons", "[]")
        try:
            addons = json.loads(addons_str) if addons_str else []
        except json.JSONDecodeError:
            addons = []

        for addon in addons:
            addon_price = float(addon.get("price", 0))
            items_detail.append({
                "product_id": str(addon.get("id", "")),
                "name": addon.get("name", "Add-on"),
                "category": "Add-on",
                "quantity": 1,
                "price": addon_price,
                "subtotal": addon_price,
            })

        summary = {
            "order_id": order_id,
            "status": status,
            "total": total,
            "item_count": len(items_detail),
            "created_at": created_at,
        }
        preview = get_item_preview(items_detail)
        if preview:
            summary["item_preview"] = preview
        order_summaries.append(summary)

        order_details.append({
            "order_id": order_id,
            "persona_id": persona_id,
            "store_id": store_id,
            "status": status,
            "created_at": created_at,
            "shipped_at": "",
            "delivered_at": order.get("delivery_date", ""),
            "shipping_address": order.get("recipient_address", ""),
            "recipient_name": order.get("recipient_name", ""),
            "card_message": order.get("card_message", ""),
            "items": items_detail,
            "total": total,
            "currency": "USD",
        })

    return order_summaries, order_details


def process_orders_store(
    store_id: str,
    persona_id: str,
    products: dict[str, dict]
) -> tuple[list[dict], list[dict]]:
    """Process an orders-based store, returning (order_summaries, order_details)."""
    # Special handling for florist which has embedded items
    if store_id == "florist":
        return process_florist_orders(store_id, persona_id, products)

    store_dir = LOCAL_SERVERS_DIR / store_id / "data"
    config = STORE_TRANSACTION_TYPES[store_id]

    orders_file = store_dir / config["file"]
    items_file = store_dir / config.get("items_file", "order_items.csv")

    if not orders_file.exists():
        return [], []

    # Load orders and filter by persona
    all_orders = load_csv(orders_file)
    persona_orders = [o for o in all_orders if o.get("user_id") == persona_id]

    # Load order items
    all_items = load_csv(items_file) if items_file.exists() else []

    # Build items lookup by order_id
    items_by_order: dict[str, list[dict]] = {}
    for item in all_items:
        order_id = item.get("order_id", "")
        if order_id not in items_by_order:
            items_by_order[order_id] = []
        items_by_order[order_id].append(item)

    order_summaries = []
    order_details = []

    for order in persona_orders:
        order_id = get_order_id_field(order)
        created_at = get_date_field(order)
        total = get_total_field(order)
        status = order.get("status", "unknown")

        # Get items for this order
        order_items = items_by_order.get(order_id, [])

        # Build item details
        items_detail = []
        for item in order_items:
            # Get product ID (different column names across stores)
            prod_id = (item.get("asin") or item.get("product_id") or
                      item.get("item_id") or item.get("perfume_id") or "")
            product = products.get(prod_id, {})

            quantity = int(item.get("quantity", 1))
            price = float(item.get("price_at_purchase", item.get("price", 0)))

            items_detail.append({
                "product_id": prod_id,
                "name": product.get("name", f"Product {prod_id}"),
                "category": product.get("category", item.get("product_category", "")),
                "quantity": quantity,
                "price": price,
                "subtotal": round(price * quantity, 2),
            })

        # Order summary (for list view)
        item_count = len(items_detail) or sum(int(i.get("quantity", 1)) for i in order_items)
        summary = {
            "order_id": order_id,
            "status": status,
            "total": total,
            "item_count": item_count,
            "created_at": created_at,
        }
        # Add item preview for small orders
        preview = get_item_preview(items_detail)
        if preview:
            summary["item_preview"] = preview
        order_summaries.append(summary)

        # Order detail (for detail view)
        order_details.append({
            "order_id": order_id,
            "persona_id": persona_id,
            "store_id": store_id,
            "status": status,
            "created_at": created_at,
            "shipped_at": order.get("shipped_at", ""),
            "delivered_at": order.get("delivered_at", ""),
            "shipping_address": order.get("shipping_address", ""),
            "items": items_detail,
            "total": total,
            "currency": order.get("currency", "USD"),
        })

    return order_summaries, order_details


def process_purchases_store(
    store_id: str,
    persona_id: str,
    products: dict[str, dict]
) -> tuple[list[dict], list[dict]]:
    """Process a purchases-based store (simpler structure)."""
    store_dir = LOCAL_SERVERS_DIR / store_id / "data"
    config = STORE_TRANSACTION_TYPES[store_id]

    purchases_file = store_dir / config["file"]
    if not purchases_file.exists():
        return [], []

    all_purchases = load_csv(purchases_file)
    persona_purchases = [p for p in all_purchases if p.get("user_id") == persona_id]

    purchase_summaries = []
    purchase_details = []

    for purchase in persona_purchases:
        purchase_id = purchase.get("id", "")
        created_at = get_date_field(purchase)
        total = get_total_field(purchase)

        # Handle different product ID field names across stores
        prod_id = (purchase.get("product_id") or purchase.get("book_id") or
                   purchase.get("item_id") or purchase.get("medicine_id") or
                   purchase.get("bean_id") or "")
        product = products.get(prod_id, {})
        quantity = int(purchase.get("quantity", 1))

        items_detail = [{
            "product_id": prod_id,
            "name": product.get("name", f"Product {prod_id}"),
            "category": product.get("category", ""),
            "quantity": quantity,
            "price": round(total / quantity, 2) if quantity else total,
            "subtotal": total,
        }]

        summary = {
            "order_id": f"PUR-{purchase_id}",
            "status": "completed",
            "total": total,
            "item_count": quantity,
            "created_at": created_at,
        }
        preview = get_item_preview(items_detail)
        if preview:
            summary["item_preview"] = preview
        purchase_summaries.append(summary)

        purchase_details.append({
            "order_id": f"PUR-{purchase_id}",
            "persona_id": persona_id,
            "store_id": store_id,
            "status": "completed",
            "created_at": created_at,
            "items": items_detail,
            "total": total,
            "currency": "USD",
        })

    return purchase_summaries, purchase_details


def process_bookings_store(
    store_id: str,
    persona_id: str,
    products: dict[str, dict]
) -> tuple[list[dict], list[dict]]:
    """Process a bookings-based store (movie theater)."""
    store_dir = LOCAL_SERVERS_DIR / store_id / "data"
    config = STORE_TRANSACTION_TYPES[store_id]

    bookings_file = store_dir / config["file"]
    if not bookings_file.exists():
        return [], []

    # Load showtimes for movie info
    showtimes_file = store_dir / "showtimes.csv"
    showtimes = {}
    if showtimes_file.exists():
        for row in load_csv(showtimes_file):
            showtimes[row.get("id", "")] = row

    all_bookings = load_csv(bookings_file)
    persona_bookings = [b for b in all_bookings if b.get("user_id") == persona_id]

    booking_summaries = []
    booking_details = []

    for booking in persona_bookings:
        booking_id = booking.get("id", "")
        showtime_id = booking.get("showtime_id", "")
        showtime = showtimes.get(showtime_id, {})
        movie_id = showtime.get("movie_id", "")
        movie = products.get(movie_id, {})

        created_at = booking.get("created_at", "")
        total = float(booking.get("total_price", 0))
        status = booking.get("status", "confirmed")
        seats = booking.get("seats", "")
        confirmation = booking.get("confirmation_code", "")

        seat_count = len(seats.split(",")) if seats else 1
        movie_name = movie.get("name", showtime.get("movie_title", "Movie"))
        showtime_str = showtime.get("start_time", "")

        booking_summaries.append({
            "order_id": booking_id,
            "display_name": movie_name,
            "description": f"{seat_count} seat{'s' if seat_count > 1 else ''} • {showtime_str}" if showtime_str else f"{seat_count} seat{'s' if seat_count > 1 else ''}",
            "status": status,
            "total": total,
            "item_count": seat_count,
            "created_at": created_at,
        })

        booking_details.append({
            "order_id": booking_id,
            "persona_id": persona_id,
            "store_id": store_id,
            "type": "booking",
            "status": status,
            "created_at": created_at,
            "confirmation_code": confirmation,
            "items": [{
                "product_id": movie_id,
                "name": movie_name,
                "showtime": showtime_str,
                "theater": showtime.get("theater", ""),
                "seats": seats,
                "quantity": seat_count,
                "price": round(total / seat_count, 2) if seat_count else total,
                "subtotal": total,
            }],
            "total": total,
            "currency": "USD",
        })

    return booking_summaries, booking_details


def process_zillow(
    store_id: str,
    persona_id: str,
    products: dict[str, dict]
) -> tuple[list[dict], list[dict]]:
    """Process Zillow scheduled tours."""
    store_dir = LOCAL_SERVERS_DIR / store_id / "data"

    tours_file = store_dir / "scheduled_tours.csv"
    if not tours_file.exists():
        return [], []

    all_tours = load_csv(tours_file)
    persona_tours = [t for t in all_tours if t.get("user_id") == persona_id]

    tour_summaries = []
    tour_details = []

    for tour in persona_tours:
        tour_id = tour.get("id", "")
        property_id = tour.get("property_id", "")
        prop = products.get(property_id, {})

        # Handle both formats: scheduled_time or tour_date + tour_time
        tour_date = tour.get("tour_date", "")
        tour_time = tour.get("tour_time", "")
        scheduled_time = tour.get("scheduled_time", "")
        if not scheduled_time and tour_date:
            scheduled_time = f"{tour_date}T{tour_time}:00" if tour_time else tour_date

        status = tour.get("status", "scheduled")
        notes = tour.get("notes", "")

        # Get property address for display
        address = prop.get("address", prop.get("name", f"Property {property_id}"))
        city = prop.get("city", "")
        price = float(prop.get("price", 0))

        display_address = f"{address}, {city}" if city else address

        tour_summaries.append({
            "order_id": f"TOUR-{tour_id}",
            "display_name": display_address,
            "description": f"${price:,.0f}" if price else "",
            "status": status,
            "total": 0,
            "item_count": 1,
            "created_at": scheduled_time,
        })

        tour_details.append({
            "order_id": f"TOUR-{tour_id}",
            "persona_id": persona_id,
            "store_id": store_id,
            "type": "tour",
            "status": status,
            "scheduled_time": scheduled_time,
            "notes": notes,
            "items": [{
                "product_id": property_id,
                "name": display_address,
                "address": address,
                "city": city,
                "price": price,
                "bedrooms": prop.get("bedrooms", ""),
                "bathrooms": prop.get("bathrooms", ""),
                "sqft": prop.get("sqft", ""),
                "home_type": prop.get("home_type", ""),
                "quantity": 1,
                "subtotal": 0,
            }],
            "total": 0,
            "currency": "USD",
        })

    return tour_summaries, tour_details


def process_zillow_saved(
    store_id: str,
    persona_id: str,
    products: dict[str, dict]
) -> tuple[list[dict], list[dict]]:
    """Process Zillow saved/favorite properties."""
    store_dir = LOCAL_SERVERS_DIR / store_id / "data"

    saved_file = store_dir / "saved_properties.csv"
    if not saved_file.exists():
        return [], []

    all_saved = load_csv(saved_file)
    persona_saved = [s for s in all_saved if s.get("user_id") == persona_id]

    summaries = []
    details = []

    for saved in persona_saved:
        saved_id = saved.get("id", "")
        property_id = saved.get("property_id", "")
        prop = products.get(property_id, {})

        saved_at = saved.get("saved_at", "")
        notes = saved.get("notes", "")

        # Get property address for display
        address = prop.get("address", prop.get("name", f"Property {property_id}"))
        city = prop.get("city", "")
        price = float(prop.get("price", 0))

        display_address = f"{address}, {city}" if city else address

        summaries.append({
            "order_id": f"SAVED-{saved_id}",
            "display_name": display_address,
            "description": f"${price:,.0f}" if price else "",
            "status": "saved",
            "total": 0,
            "item_count": 1,
            "created_at": saved_at,
        })

        details.append({
            "order_id": f"SAVED-{saved_id}",
            "persona_id": persona_id,
            "store_id": store_id,
            "type": "saved_property",
            "status": "saved",
            "created_at": saved_at,
            "notes": notes,
            "items": [{
                "product_id": property_id,
                "name": display_address,
                "address": address,
                "city": city,
                "price": price,
                "bedrooms": prop.get("bedrooms", ""),
                "bathrooms": prop.get("bathrooms", ""),
                "sqft": prop.get("sqft", ""),
                "home_type": prop.get("home_type", ""),
                "quantity": 1,
                "subtotal": 0,
            }],
            "total": 0,
            "currency": "USD",
        })

    return summaries, details


def process_car_inquiries(
    store_id: str,
    persona_id: str,
    products: dict[str, dict]
) -> tuple[list[dict], list[dict]]:
    """Process Car Deals inquiries."""
    store_dir = LOCAL_SERVERS_DIR / store_id / "data"
    inquiries_file = store_dir / "inquiries.csv"

    summaries = []
    details = []

    if not inquiries_file.exists():
        return summaries, details

    all_inquiries = load_csv(inquiries_file)
    persona_inquiries = [i for i in all_inquiries if i.get("user_id") == persona_id]

    for inquiry in persona_inquiries:
        inquiry_id = inquiry.get("id", "")
        listing_id = inquiry.get("listing_id", "")
        car = products.get(listing_id, {})
        created_at = inquiry.get("created_at", "")
        car_name = car.get("name", f"Vehicle {listing_id}")
        car_price = float(car.get("price", 0))

        summaries.append({
            "order_id": f"INQ-{inquiry_id}",
            "display_name": car_name,
            "description": f"${car_price:,.0f}" if car_price else "",
            "status": inquiry.get("status", "pending"),
            "total": 0,
            "item_count": 1,
            "created_at": created_at,
        })

        details.append({
            "order_id": f"INQ-{inquiry_id}",
            "persona_id": persona_id,
            "store_id": store_id,
            "type": "inquiry",
            "status": inquiry.get("status", "pending"),
            "created_at": created_at,
            "message": inquiry.get("message", ""),
            "items": [{
                "product_id": listing_id,
                "name": car.get("name", f"Vehicle {listing_id}"),
                "quantity": 1,
                "price": float(car.get("price", 0)),
                "subtotal": 0,
            }],
            "total": 0,
            "currency": "USD",
        })

    return summaries, details


def process_car_test_drives(
    store_id: str,
    persona_id: str,
    products: dict[str, dict]
) -> tuple[list[dict], list[dict]]:
    """Process Car Deals test drives."""
    store_dir = LOCAL_SERVERS_DIR / store_id / "data"
    test_drives_file = store_dir / "test_drive_bookings.csv"

    summaries = []
    details = []

    if not test_drives_file.exists():
        return summaries, details

    all_test_drives = load_csv(test_drives_file)
    persona_test_drives = [t for t in all_test_drives if t.get("user_id") == persona_id]

    for td in persona_test_drives:
        td_id = td.get("id", "")
        listing_id = td.get("listing_id", "")
        car = products.get(listing_id, {})
        scheduled = td.get("preferred_date", td.get("created_at", ""))
        status = td.get("status", "requested")
        car_name = car.get("name", f"Vehicle {listing_id}")
        car_price = float(car.get("price", 0))

        summaries.append({
            "order_id": f"TD-{td_id}",
            "display_name": car_name,
            "description": f"${car_price:,.0f}" if car_price else "",
            "status": status,
            "total": 0,
            "item_count": 1,
            "created_at": scheduled,
        })

        details.append({
            "order_id": f"TD-{td_id}",
            "persona_id": persona_id,
            "store_id": store_id,
            "type": "test_drive",
            "status": status,
            "scheduled_date": scheduled,
            "preferred_time": td.get("preferred_time", ""),
            "notes": td.get("notes", ""),
            "items": [{
                "product_id": listing_id,
                "name": car.get("name", f"Vehicle {listing_id}"),
                "quantity": 1,
                "price": float(car.get("price", 0)),
                "subtotal": 0,
            }],
            "total": 0,
            "currency": "USD",
        })

    return summaries, details


def process_florist_subscriptions(
    store_id: str,
    persona_id: str,
) -> tuple[list[dict], list[dict]]:
    """Process florist subscriptions."""
    store_dir = LOCAL_SERVERS_DIR / store_id / "data"
    subs_file = store_dir / "subscriptions.csv"
    if not subs_file.exists():
        return [], []

    all_subs = load_csv(subs_file)
    persona_subs = [s for s in all_subs if s.get("user_id") == persona_id]

    summaries = []
    details = []

    for sub in persona_subs:
        sub_id = sub.get("id", "")
        plan_name = sub.get("plan_name", "")
        frequency = sub.get("frequency", "")
        price = float(sub.get("price_per_delivery", 0))
        status = sub.get("status", "active")
        created_at = sub.get("created_at", "")
        next_delivery = sub.get("next_delivery_date", "")
        recipient = sub.get("recipient_name", "")
        arrangement = sub.get("arrangement_preference", "")

        summaries.append({
            "order_id": f"SUB-{sub_id}",
            "display_name": plan_name,
            "description": f"{frequency.title()} · {arrangement}" if arrangement else frequency.title(),
            "status": status,
            "total": price,
            "item_count": 1,
            "created_at": created_at,
        })

        details.append({
            "order_id": f"SUB-{sub_id}",
            "persona_id": persona_id,
            "store_id": store_id,
            "type": "subscription",
            "status": status,
            "created_at": created_at,
            "items": [{
                "product_id": f"plan-{sub_id}",
                "name": plan_name,
                "description": f"{frequency.title()} delivery - {arrangement}",
                "recipient": recipient,
                "next_delivery": next_delivery,
                "quantity": 1,
                "price": price,
                "subtotal": price,
            }],
            "total": price,
            "currency": "USD",
        })

    return summaries, details


def process_coffee_subscriptions(
    store_id: str,
    persona_id: str,
) -> tuple[list[dict], list[dict]]:
    """Process coffee roaster subscriptions."""
    store_dir = LOCAL_SERVERS_DIR / store_id / "data"
    subs_file = store_dir / "user_subscriptions.csv"
    plans_file = store_dir / "subscriptions.csv"

    if not subs_file.exists():
        return [], []

    # Load subscription plans
    plans = {}
    if plans_file.exists():
        for row in load_csv(plans_file):
            plans[row.get("id", "")] = row

    all_subs = load_csv(subs_file)
    persona_subs = [s for s in all_subs if s.get("user_id") == persona_id]

    summaries = []
    details = []

    for sub in persona_subs:
        sub_id = sub.get("id", "")
        plan_id = sub.get("plan_id", "")
        plan = plans.get(plan_id, {})
        plan_name = plan.get("name", f"Plan {plan_id}")
        bean_preference = sub.get("bean_preference", "")
        status = sub.get("status", "active")
        created_at = sub.get("created_at", "")
        next_delivery = sub.get("next_delivery", "")
        price = float(plan.get("price_per_shipment", 0))

        frequency = plan.get("frequency", "")
        summaries.append({
            "order_id": f"CSUB-{sub_id}",
            "display_name": plan_name,
            "description": f"{frequency.title()} · {bean_preference}" if bean_preference else frequency.title(),
            "status": status,
            "total": price,
            "item_count": 1,
            "created_at": created_at,
        })

        details.append({
            "order_id": f"CSUB-{sub_id}",
            "persona_id": persona_id,
            "store_id": store_id,
            "type": "subscription",
            "status": status,
            "created_at": created_at,
            "items": [{
                "product_id": f"plan-{plan_id}",
                "name": plan_name,
                "description": plan.get("description", ""),
                "bean_preference": bean_preference,
                "frequency": plan.get("frequency", ""),
                "next_delivery": next_delivery,
                "quantity": 1,
                "price": price,
                "subtotal": price,
            }],
            "total": price,
            "currency": "USD",
        })

    return summaries, details


def process_pet_grooming(
    store_id: str,
    persona_id: str,
) -> tuple[list[dict], list[dict]]:
    """Process pet store grooming appointments."""
    store_dir = LOCAL_SERVERS_DIR / store_id / "data"
    appts_file = store_dir / "grooming_appointments.csv"
    services_file = store_dir / "grooming_services.csv"
    pets_file = store_dir / "pet_profiles.csv"

    if not appts_file.exists():
        return [], []

    # Load grooming services
    services = {}
    if services_file.exists():
        for row in load_csv(services_file):
            services[row.get("id", "")] = row

    # Load pet profiles
    pets = {}
    if pets_file.exists():
        for row in load_csv(pets_file):
            pets[row.get("id", "")] = row

    all_appts = load_csv(appts_file)
    persona_appts = [a for a in all_appts if a.get("user_id") == persona_id]

    summaries = []
    details = []

    for appt in persona_appts:
        appt_id = appt.get("id", "")
        pet_id = appt.get("pet_id", "")
        service_id = appt.get("service_id", "")

        pet = pets.get(pet_id, {})
        service = services.get(service_id, {})

        appt_date = appt.get("appointment_date", "")
        appt_time = appt.get("appointment_time", "")
        status = appt.get("status", "scheduled")
        price = float(service.get("price", 0))

        created_at = f"{appt_date}T{appt_time}:00" if appt_date and appt_time else appt_date
        service_name = service.get("name", "Grooming Service")
        pet_name = pet.get("name", "")

        summaries.append({
            "order_id": f"GRM-{appt_id}",
            "display_name": f"{service_name} for {pet_name}" if pet_name else service_name,
            "description": f"{appt_date} at {appt_time}" if appt_time else appt_date,
            "status": status,
            "total": price,
            "item_count": 1,
            "created_at": created_at,
        })

        details.append({
            "order_id": f"GRM-{appt_id}",
            "persona_id": persona_id,
            "store_id": store_id,
            "type": "grooming",
            "status": status,
            "appointment_date": appt_date,
            "appointment_time": appt_time,
            "items": [{
                "product_id": service_id,
                "name": service.get("name", "Grooming Service"),
                "description": service.get("description", ""),
                "pet_name": pet.get("name", ""),
                "pet_type": pet.get("pet_type", ""),
                "pet_breed": pet.get("breed", ""),
                "duration_minutes": service.get("duration_minutes", ""),
                "quantity": 1,
                "price": price,
                "subtotal": price,
            }],
            "total": price,
            "currency": "USD",
        })

    return summaries, details


def process_pet_profiles(
    store_id: str,
    persona_id: str,
) -> tuple[list[dict], list[dict]]:
    """Process pet profiles (no cost, informational only)."""
    store_dir = LOCAL_SERVERS_DIR / store_id / "data"
    pets_file = store_dir / "pet_profiles.csv"

    if not pets_file.exists():
        return [], []

    all_pets = load_csv(pets_file)
    persona_pets = [p for p in all_pets if p.get("user_id") == persona_id]

    summaries = []
    details = []

    for pet in persona_pets:
        pet_id = pet.get("id", "")
        name = pet.get("name", "")
        pet_type = pet.get("pet_type", "")
        breed = pet.get("breed", "")
        age = pet.get("age_years", "")
        weight = pet.get("weight_lbs", "")
        notes = pet.get("notes", "")

        summaries.append({
            "order_id": pet_id,
            "display_name": name,  # Show pet name in list
            "description": f"{breed} ({pet_type})",  # Show breed and type
            "status": "active",
            "total": 0,
            "item_count": 1,
            "created_at": "",  # No creation date for pets
        })

        details.append({
            "order_id": pet_id,
            "persona_id": persona_id,
            "store_id": store_id,
            "type": "pet_profile",
            "status": "active",
            "items": [{
                "product_id": pet_id,
                "name": name,
                "pet_type": pet_type,
                "breed": breed,
                "age_years": age,
                "weight_lbs": weight,
                "dietary_restrictions": pet.get("dietary_restrictions", ""),
                "notes": notes,
                "quantity": 1,
                "price": 0,
                "subtotal": 0,
            }],
            "total": 0,
            "currency": "USD",
        })

    return summaries, details


def process_toy_wishlists(
    store_id: str,
    persona_id: str,
    products: dict[str, dict],
) -> tuple[list[dict], list[dict]]:
    """Process toy store wishlists."""
    store_dir = LOCAL_SERVERS_DIR / store_id / "data"
    wishlists_file = store_dir / "wishlists.csv"

    if not wishlists_file.exists():
        return [], []

    all_wishlists = load_csv(wishlists_file)
    persona_wishlists = [w for w in all_wishlists if w.get("user_id") == persona_id]

    summaries = []
    details = []

    for item in persona_wishlists:
        item_id = item.get("id", "")
        child_name = item.get("child_name", "")
        product_id = item.get("product_id", "")
        product = products.get(product_id, {})
        priority = item.get("priority", "medium")
        occasion = item.get("occasion", "")
        added_at = item.get("added_at", "")

        product_name = product.get("name", f"Product {product_id}")
        product_price = float(product.get("price", 0))

        summaries.append({
            "order_id": f"WISH-{item_id}",
            "display_name": product_name,
            "description": f"For {child_name} • {occasion}" if child_name else occasion,
            "status": priority,
            "total": 0,
            "item_count": 1,
            "created_at": added_at,
        })

        details.append({
            "order_id": f"WISH-{item_id}",
            "persona_id": persona_id,
            "store_id": store_id,
            "type": "wishlist",
            "status": priority,
            "created_at": added_at,
            "items": [{
                "product_id": product_id,
                "name": product_name,
                "category": product.get("category", ""),
                "child_name": child_name,
                "occasion": occasion,
                "priority": priority,
                "quantity": 1,
                "price": product_price,
                "subtotal": 0,
            }],
            "total": 0,
            "currency": "USD",
        })

    return summaries, details


def process_bakery_preorders(
    store_id: str,
    persona_id: str,
) -> tuple[list[dict], list[dict]]:
    """Process bakery preorders (custom cakes, etc.)."""
    store_dir = LOCAL_SERVERS_DIR / store_id / "data"
    preorders_file = store_dir / "preorders.csv"

    if not preorders_file.exists():
        return [], []

    all_preorders = load_csv(preorders_file)
    persona_preorders = [p for p in all_preorders if p.get("user_id") == persona_id]

    summaries = []
    details = []

    for preorder in persona_preorders:
        preorder_id = preorder.get("id", "")
        order_type = preorder.get("order_type", "custom")
        items_json = preorder.get("items", "[]")
        instructions = preorder.get("special_instructions", "")
        pickup_date = preorder.get("pickup_date", "")
        pickup_time = preorder.get("pickup_time", "")
        total = float(preorder.get("total_price", 0))
        status = preorder.get("status", "pending")
        created_at = preorder.get("created_at", "")

        # Parse items JSON
        try:
            items_data = json.loads(items_json) if items_json else []
        except json.JSONDecodeError:
            items_data = []

        # Build item details
        items_detail = []
        for item in items_data:
            if item.get("type") == "custom_cake":
                options = item.get("options", {})
                name = f"Custom {options.get('flavor', '')} {options.get('size', '')} Cake"
                description = f"{options.get('frosting', '')} frosting, {options.get('filling', '')} filling, {options.get('decoration', '')} decoration"
            else:
                name = item.get("name", "Item")
                description = ""

            items_detail.append({
                "product_id": f"preorder-{preorder_id}",
                "name": name.strip(),
                "description": description,
                "quantity": item.get("quantity", 1),
                "price": float(item.get("price", item.get("total", 0))),
                "subtotal": float(item.get("price", item.get("total", 0))),
            })

        summary = {
            "order_id": f"PRE-{preorder_id}",
            "status": status,
            "total": total,
            "item_count": len(items_detail) or 1,
            "created_at": created_at,
        }
        preview = get_item_preview(items_detail)
        if preview:
            summary["item_preview"] = preview
        summaries.append(summary)

        details.append({
            "order_id": f"PRE-{preorder_id}",
            "persona_id": persona_id,
            "store_id": store_id,
            "type": "preorder",
            "status": status,
            "created_at": created_at,
            "pickup_date": pickup_date,
            "pickup_time": pickup_time,
            "special_instructions": instructions,
            "items": items_detail if items_detail else [{
                "product_id": f"preorder-{preorder_id}",
                "name": f"Custom {order_type}",
                "quantity": 1,
                "price": total,
                "subtotal": total,
            }],
            "total": total,
            "currency": "USD",
        })

    return summaries, details


def process_category(
    store_id: str,
    persona_id: str,
    category: dict,
    products: dict[str, dict],
) -> tuple[list[dict], list[dict]]:
    """Process a single category for a store."""
    cat_type = category.get("type", "orders")

    if cat_type == "orders":
        return process_orders_store(store_id, persona_id, products)
    elif cat_type == "purchases":
        return process_purchases_store(store_id, persona_id, products)
    elif cat_type == "bookings":
        return process_bookings_store(store_id, persona_id, products)
    elif cat_type == "tours":
        return process_zillow(store_id, persona_id, products)
    elif cat_type == "inquiries":
        return process_car_inquiries(store_id, persona_id, products)
    elif cat_type == "test_drives":
        return process_car_test_drives(store_id, persona_id, products)
    elif cat_type == "subscriptions":
        if store_id == "florist":
            return process_florist_subscriptions(store_id, persona_id)
        elif store_id == "coffee_roaster":
            return process_coffee_subscriptions(store_id, persona_id)
    elif cat_type == "grooming":
        return process_pet_grooming(store_id, persona_id)
    elif cat_type == "pets":
        return process_pet_profiles(store_id, persona_id)
    elif cat_type == "preorders":
        return process_bakery_preorders(store_id, persona_id)
    elif cat_type == "wishlists":
        return process_toy_wishlists(store_id, persona_id, products)
    elif cat_type == "saved":
        return process_zillow_saved(store_id, persona_id, products)

    return [], []


def process_store(
    store_id: str,
    persona_id: str
) -> dict[str, tuple[list[dict], list[dict]]]:
    """Process all categories for a store, returning {category_id: (summaries, details)}."""
    if store_id not in STORE_CATEGORIES:
        return {}

    products = load_products(store_id)
    categories = STORE_CATEGORIES[store_id]

    result = {}
    for category in categories:
        cat_id = category["id"]
        summaries, details = process_category(store_id, persona_id, category, products)
        if summaries:
            result[cat_id] = (summaries, details, category)

    return result


def generate_persona_data(
    persona: dict,
    store_mapping: dict
) -> tuple[dict, dict[str, dict]]:
    """
    Generate all data for a single persona.

    Returns:
        (profile_data, {store_id: {category_id: (summaries, details, category)}})
    """
    persona_id = persona["id"]

    # Get stores for this persona
    universal_stores = store_mapping.get("universal_stores", [])
    specialty_stores = store_mapping.get("specialty_stores", [])
    all_stores = universal_stores + specialty_stores

    # Process each store
    store_data: dict[str, dict] = {}
    store_summaries = []
    total_orders = 0
    total_spent = 0.0

    for store_id in all_stores:
        category_data = process_store(store_id, persona_id)
        if category_data:
            store_data[store_id] = category_data

            # Calculate totals across all categories
            all_summaries = []
            for cat_id, (summaries, details, category) in category_data.items():
                all_summaries.extend(summaries)

            item_count = len(all_summaries)
            spent = sum(s.get("total", 0) for s in all_summaries)
            total_orders += item_count
            total_spent += spent

            # Get primary category info for the store summary
            categories = STORE_CATEGORIES.get(store_id, [])
            primary_cat = next((c for c in categories if c.get("primary")), categories[0] if categories else {})
            tx_type = primary_cat.get("type", "orders")
            tx_labels = TRANSACTION_TYPE_LABELS.get(tx_type, TRANSACTION_TYPE_LABELS["orders"])

            # Build category summaries for the store
            cat_summaries = []
            for cat_id, (summaries, details, category) in category_data.items():
                cat_tx_type = category.get("type", "orders")
                cat_tx_labels = TRANSACTION_TYPE_LABELS.get(cat_tx_type, TRANSACTION_TYPE_LABELS["orders"])
                cat_summaries.append({
                    "id": cat_id,
                    "name": category.get("name", cat_id),
                    "type": cat_tx_type,
                    "item_count": len(summaries),
                    "total_spent": round(sum(s.get("total", 0) for s in summaries), 2),
                    "has_cost": cat_tx_labels["has_cost"],
                })

            store_summaries.append({
                "id": store_id,
                "name": STORE_NAMES.get(store_id, store_id),
                "item_count": item_count,
                "total_spent": round(spent, 2),
                "transaction_type": tx_type,
                "transaction_label": tx_labels["plural"],
                "has_cost": tx_labels["has_cost"],
                "categories": cat_summaries,
            })

    # Build profile
    location = store_mapping.get("location", {})
    profile = {
        "id": persona_id,
        "name": persona["name"],
        "initials": get_initials(persona["name"]),
        "demographics": {
            "age_group": persona.get("age_group", store_mapping.get("age_group", "")),
            "gender": persona.get("gender", ""),
            "ethnicity": persona.get("ethnicity", ""),
            "marital_status": persona.get("marital_status", ""),
            "family_role": persona.get("family_role", store_mapping.get("family_role", "")),
        },
        "professional": {
            "profession": persona.get("profession", ""),
            "industry": persona.get("industry", ""),
            "experience_level": persona.get("experience_level", ""),
        },
        "location": {
            "city": location.get("city", persona.get("location", {}).get("city", "")),
            "region": location.get("region", persona.get("location", {}).get("region", "")),
            "country": persona.get("location", {}).get("country", "USA"),
            "address": location.get("address", ""),
        },
        "personality_traits": persona.get("personality_traits", []),
        "interests": store_mapping.get("interests", persona.get("interests", [])),
        "summary": persona.get("summary", ""),
        "stores": sorted(store_summaries, key=lambda x: x["item_count"], reverse=True),
        "stats": {
            "total_orders": total_orders,
            "total_spent": round(total_spent, 2),
            "stores_count": len(store_summaries),
        },
    }

    return profile, store_data


def write_json(filepath: Path, data: Any) -> None:
    """Write data to a JSON file."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)


def main():
    """Main entry point."""
    print("Loading persona data...")
    personas = load_personas()
    store_mappings = load_store_mappings()

    # Clear output directory
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    OUTPUT_DIR.mkdir(parents=True)

    # Process each persona
    all_personas_summary = []
    total_orders = 0
    total_stores = set()

    for persona in personas:
        persona_id = persona["id"]
        print(f"Processing {persona['name']} ({persona_id})...")

        # Get store mapping for this persona
        store_mapping = store_mappings.get(persona_id, {})
        if not store_mapping:
            print(f"  Warning: No store mapping found for {persona_id}")
            continue

        # Generate persona data
        profile, store_data = generate_persona_data(persona, store_mapping)

        # Write profile
        persona_dir = OUTPUT_DIR / persona_id
        write_json(persona_dir / "profile.json", profile)

        # Write store data
        for store_id, category_data in store_data.items():
            store_dir = persona_dir / "stores" / store_id

            # Build category list for the store index
            categories_list = []
            all_summaries = []
            all_dates = []

            for cat_id, (summaries, details, category) in category_data.items():
                cat_type = category.get("type", "orders")
                cat_labels = TRANSACTION_TYPE_LABELS.get(cat_type, TRANSACTION_TYPE_LABELS["orders"])

                # Get dates for this category
                cat_dates = [s.get("created_at", "") for s in summaries if s.get("created_at")]
                cat_dates = sorted([d for d in cat_dates if d])
                all_dates.extend(cat_dates)

                categories_list.append({
                    "id": cat_id,
                    "name": category.get("name", cat_id),
                    "type": cat_type,
                    "label": cat_labels["plural"],
                    "has_cost": cat_labels["has_cost"],
                    "summary": {
                        "total_count": len(summaries),
                        "total_spent": round(sum(s.get("total", 0) for s in summaries), 2),
                        "first_date": cat_dates[0][:10] if cat_dates else "",
                        "last_date": cat_dates[-1][:10] if cat_dates else "",
                    },
                    "items": sorted(summaries, key=lambda x: x.get("created_at", ""), reverse=True),
                })

                all_summaries.extend(summaries)

                # Write individual item details
                for detail in details:
                    order_id = detail["order_id"]
                    write_json(store_dir / "orders" / f"{order_id}.json", detail)

            # Get primary category info for backward compatibility
            store_categories = STORE_CATEGORIES.get(store_id, [])
            primary_cat = next((c for c in store_categories if c.get("primary")), store_categories[0] if store_categories else {})
            tx_type = primary_cat.get("type", "orders")
            tx_labels = TRANSACTION_TYPE_LABELS.get(tx_type, TRANSACTION_TYPE_LABELS["orders"])

            all_dates = sorted([d for d in all_dates if d])

            store_index = {
                "persona_id": persona_id,
                "store_id": store_id,
                "store_name": STORE_NAMES.get(store_id, store_id),
                "transaction_type": tx_type,
                "transaction_label": tx_labels["plural"],
                "has_cost": tx_labels["has_cost"],
                "summary": {
                    "total_count": len(all_summaries),
                    "total_spent": round(sum(s.get("total", 0) for s in all_summaries), 2),
                    "first_date": all_dates[0][:10] if all_dates else "",
                    "last_date": all_dates[-1][:10] if all_dates else "",
                },
                # For single-category stores, keep items at top level for backward compatibility
                "items": sorted(all_summaries, key=lambda x: x.get("created_at", ""), reverse=True) if len(categories_list) == 1 else [],
                # Always include categories array
                "categories": categories_list,
            }
            write_json(store_dir / "index.json", store_index)

            total_stores.add(store_id)

        # Add to summary
        all_personas_summary.append({
            "id": persona_id,
            "name": persona["name"],
            "initials": get_initials(persona["name"]),
            "profession": persona.get("profession", ""),
            "industry": persona.get("industry", ""),
            "city": profile["location"]["city"],
            "region": profile["location"]["region"],
            "age_group": profile["demographics"]["age_group"],
            "total_orders": profile["stats"]["total_orders"],
            "total_spent": profile["stats"]["total_spent"],
        })

        total_orders += profile["stats"]["total_orders"]
        print(f"  Generated {profile['stats']['total_orders']} orders across {profile['stats']['stores_count']} stores")

    # Write main index
    index_data = {
        "personas": sorted(all_personas_summary, key=lambda x: x["name"]),
        "stats": {
            "total_personas": len(all_personas_summary),
            "total_orders": total_orders,
            "total_stores": len(total_stores),
        },
        "generated_at": datetime.now().isoformat(),
    }
    write_json(OUTPUT_DIR / "index.json", index_data)

    print(f"\nDone! Generated data for {len(all_personas_summary)} personas")
    print(f"Total orders: {total_orders}")
    print(f"Total stores: {len(total_stores)}")
    print(f"Output: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
