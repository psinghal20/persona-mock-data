"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { StoreCategory, ItemSummary } from "@/types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusClass(status: string): string {
  const normalized = status.toLowerCase().replace(/[^a-z]/g, "_");
  return `badge badge-${normalized}`;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncatePreview(preview: string, maxItems: number = 2): string {
  const names = preview.split(", ");
  if (names.length <= maxItems) return preview;
  return names.slice(0, maxItems).join(", ") + ", ...";
}

function matchesFilter(item: ItemSummary, query: string): boolean {
  const q = query.toLowerCase();
  return (
    (item.display_name?.toLowerCase().includes(q) ?? false) ||
    (item.description?.toLowerCase().includes(q) ?? false) ||
    (item.item_preview?.toLowerCase().includes(q) ?? false) ||
    item.order_id.toLowerCase().includes(q) ||
    item.status.toLowerCase().includes(q)
  );
}

function CategorySection({
  category,
  personaId,
  storeId,
  filter,
}: {
  category: StoreCategory;
  personaId: string;
  storeId: string;
  filter: string;
}) {
  const hasCost = category.has_cost;
  const label = category.label;

  const filteredItems = useMemo(() => {
    if (!filter.trim()) return category.items;
    return category.items.filter((item) => matchesFilter(item, filter));
  }, [category.items, filter]);

  if (filter.trim() && filteredItems.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-header mb-0">{category.name}</h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[var(--muted)]">
            {filter.trim()
              ? `${filteredItems.length} of ${category.summary.total_count} ${label}`
              : `${category.summary.total_count} ${label}`}
          </span>
          {hasCost && category.summary.total_spent > 0 && (
            <span className="font-medium text-[var(--accent)]">
              {formatCurrency(category.summary.total_spent)}
            </span>
          )}
        </div>
      </div>

      <div className="card-static overflow-hidden">
        {filteredItems.map((item) => (
          <Link
            key={item.order_id}
            href={`/personas/${personaId}/store/${storeId}/order/${item.order_id}`}
            className="order-row"
          >
            <div className="flex items-center gap-4">
              <div>
                {item.display_name ? (
                  <>
                    <div className="font-medium">{item.display_name}</div>
                    <div className="text-xs text-[var(--muted)] mt-1">
                      {item.description ? `${item.description} · ` : ""}
                      {item.order_id}
                    </div>
                  </>
                ) : item.item_preview ? (
                  <>
                    <div className="font-medium">{truncatePreview(item.item_preview)}</div>
                    <div className="text-xs text-[var(--muted)] mt-1">
                      {item.order_id} · {formatDate(item.created_at)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-mono text-sm">{item.order_id}</div>
                    <div className="text-xs text-[var(--muted)] mt-1">
                      {formatDate(item.created_at)}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-sm text-[var(--muted)]">
                {item.item_count} item{item.item_count !== 1 ? "s" : ""}
              </div>
              {hasCost && (
                <div className="font-medium w-24 text-right">
                  {formatCurrency(item.total)}
                </div>
              )}
              <span className={getStatusClass(item.status)}>
                {item.status}
              </span>
              <svg
                className="w-4 h-4 text-[var(--muted)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

interface StoreItemBrowserProps {
  categories: StoreCategory[];
  personaId: string;
  storeId: string;
}

export default function StoreItemBrowser({
  categories,
  personaId,
  storeId,
}: StoreItemBrowserProps) {
  const [filter, setFilter] = useState("");

  const totalItems = categories.reduce(
    (sum, cat) => sum + cat.items.length,
    0
  );

  const filteredCount = useMemo(() => {
    if (!filter.trim()) return totalItems;
    return categories.reduce(
      (sum, cat) =>
        sum + cat.items.filter((item) => matchesFilter(item, filter)).length,
      0
    );
  }, [categories, filter, totalItems]);

  return (
    <div className="space-y-6">
      {totalItems > 3 && (
        <div className="flex items-center gap-4">
          <input
            type="text"
            className="filter-input"
            placeholder="Filter items..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {filter.trim() && (
            <span className="text-sm text-[var(--muted)] whitespace-nowrap">
              {filteredCount} of {totalItems} items
            </span>
          )}
        </div>
      )}

      {filter.trim() && filteredCount === 0 ? (
        <div className="card-static p-8 text-center">
          <p className="text-[var(--muted)]">No items match &ldquo;{filter}&rdquo;</p>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              personaId={personaId}
              storeId={storeId}
              filter={filter}
            />
          ))}
        </div>
      )}
    </div>
  );
}
