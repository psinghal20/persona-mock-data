#!/usr/bin/env python3
"""Validate that generated JSON data matches source CSV data from mock servers."""

import csv
import json
from pathlib import Path
from collections import defaultdict

# Paths
LOCAL_SERVERS = Path("../services/agent-environment/src/agent_environment/local_servers")
GENERATED_DATA = Path("out")

# Store to CSV file mappings
STORE_DATA_FILES = {
    "amazon": {"orders": "orders.csv", "order_items": "order_items.csv"},
    "walmart": {"orders": "orders.csv", "order_items": "order_items.csv"},
    "bakery": {"purchases": "purchases.csv", "preorders": "preorders.csv"},
    "bookstore": {"purchases": "purchases.csv"},
    "coffee_roaster": {"purchases": "purchases.csv", "subscriptions": "user_subscriptions.csv"},
    "florist": {"orders": "orders.csv", "subscriptions": "subscriptions.csv"},
    "grocery": {"orders": "orders.csv", "order_items": "order_items.csv"},
    "movie_theater": {"bookings": "bookings.csv"},
    "pet_store": {"purchases": "purchases.csv", "grooming": "grooming_appointments.csv", "pets": "pet_profiles.csv"},
    "pharmacy": {"purchases": "purchases.csv"},
    "zillow": {"tours": "scheduled_tours.csv", "saved": "saved_properties.csv"},
    "car_deals": {"inquiries": "inquiries.csv", "test_drives": "test_drive_bookings.csv"},
    "pc_parts": {"orders": "orders.csv", "order_items": "order_items.csv"},
    "electronics_store": {"orders": "orders.csv", "order_items": "order_items.csv"},
    "fashion": {"orders": "orders.csv", "order_items": "order_items.csv"},
    "sephora": {"orders": "orders.csv", "order_items": "order_items.csv"},
    "perfume_shop": {"orders": "orders.csv", "order_items": "order_items.csv"},
    "jewelry": {"orders": "orders.csv", "order_items": "order_items.csv"},
    "sporting_goods": {"orders": "orders.csv", "order_items": "order_items.csv"},
    "toy_store": {"orders": "orders.csv", "order_items": "order_items.csv", "wishlists": "wishlists.csv"},
    "furniture_store": {"orders": "orders.csv", "order_items": "order_items.csv"},
    "jewelry_store": {"orders": "orders.csv", "order_items": "order_items.csv"},
}

def count_csv_records(csv_path: Path, user_id_field: str = "user_id") -> dict[str, int]:
    """Count records per user in a CSV file."""
    counts = defaultdict(int)
    if not csv_path.exists():
        return counts

    with open(csv_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            user_id = row.get(user_id_field, "")
            if user_id:
                counts[user_id] += 1
    return counts

def count_json_items(json_path: Path) -> int:
    """Count items in a store's index.json."""
    if not json_path.exists():
        return 0

    with open(json_path, "r") as f:
        data = json.load(f)

    # Sum items across all categories
    total = 0
    for category in data.get("categories", []):
        total += len(category.get("items", []))
    return total

def get_json_category_counts(json_path: Path) -> dict[str, int]:
    """Get item counts per category from store's index.json."""
    counts = {}
    if not json_path.exists():
        return counts

    with open(json_path, "r") as f:
        data = json.load(f)

    for category in data.get("categories", []):
        cat_id = category.get("id", "unknown")
        counts[cat_id] = len(category.get("items", []))
    return counts

def validate_store(store_id: str, user_id: str) -> list[str]:
    """Validate a single store's data for a user. Returns list of issues."""
    issues = []

    data_files = STORE_DATA_FILES.get(store_id, {})
    if not data_files:
        return [f"Unknown store: {store_id}"]

    store_path = LOCAL_SERVERS / store_id / "data"
    json_path = GENERATED_DATA / user_id / "stores" / store_id / "index.json"

    if not json_path.exists():
        # Check if user has any data in CSVs for this store
        has_csv_data = False
        for csv_file in data_files.values():
            csv_path = store_path / csv_file
            counts = count_csv_records(csv_path)
            if counts.get(user_id, 0) > 0:
                has_csv_data = True
                break

        if has_csv_data:
            issues.append(f"Missing JSON but has CSV data")
        return issues

    json_counts = get_json_category_counts(json_path)

    # Map CSV files to categories
    category_map = {
        "orders": "orders",
        "purchases": "purchases",
        "bookings": "bookings",
        "subscriptions": "subscriptions",
        "grooming": "grooming",
        "pets": "pets",
        "tours": "tours",
        "saved": "saved",
        "inquiries": "inquiries",
        "test_drives": "test_drives",
        "preorders": "preorders",
        "wishlists": "wishlists",
    }

    # Group CSV counts by target category
    csv_category_counts = defaultdict(int)
    for data_type, csv_file in data_files.items():
        if data_type == "order_items":
            continue  # Skip order_items, we count orders

        csv_path = store_path / csv_file
        csv_counts = count_csv_records(csv_path)
        csv_count = csv_counts.get(user_id, 0)

        category_id = category_map.get(data_type, data_type)
        csv_category_counts[category_id] += csv_count

    # Compare aggregated CSV counts with JSON counts
    all_categories = set(csv_category_counts.keys()) | set(json_counts.keys())
    for category_id in all_categories:
        csv_count = csv_category_counts.get(category_id, 0)
        json_count = json_counts.get(category_id, 0)

        if csv_count != json_count:
            issues.append(f"{category_id}: CSV={csv_count}, JSON={json_count}")

    return issues

def get_all_personas() -> list[str]:
    """Get all persona IDs from generated data."""
    personas = []
    for path in GENERATED_DATA.iterdir():
        if path.is_dir() and path.name != "index.json":
            personas.append(path.name)
    return sorted(personas)

def main():
    print("=" * 70)
    print("DATA VALIDATION REPORT")
    print("Comparing source CSVs with generated JSON files")
    print("=" * 70)
    print()

    personas = get_all_personas()
    total_issues = 0
    stores_checked = 0

    for persona_id in personas:
        persona_path = GENERATED_DATA / persona_id
        profile_path = persona_path / "profile.json"

        if not profile_path.exists():
            print(f"⚠️  {persona_id}: Missing profile.json")
            continue

        with open(profile_path, "r") as f:
            profile = json.load(f)

        persona_name = profile.get("name", persona_id)
        stores = profile.get("stores", [])

        print(f"📋 {persona_name} ({persona_id})")
        print(f"   Stores: {len(stores)}")

        persona_issues = []
        for store in stores:
            store_id = store["id"]
            issues = validate_store(store_id, persona_id)
            stores_checked += 1

            if issues:
                persona_issues.append((store_id, issues))

        if persona_issues:
            for store_id, issues in persona_issues:
                for issue in issues:
                    print(f"   ❌ {store_id}: {issue}")
                    total_issues += 1
        else:
            print(f"   ✅ All stores validated")
        print()

    print("=" * 70)
    print(f"SUMMARY: {stores_checked} stores checked, {total_issues} issues found")
    if total_issues == 0:
        print("✅ All data is in sync!")
    else:
        print("❌ Some data mismatches detected - review above")
    print("=" * 70)

if __name__ == "__main__":
    main()
