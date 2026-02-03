import Link from "next/link";
import { OrderDetail, PersonaProfile, StoreIndex, IndexData } from "@/types";

interface PageProps {
  params: Promise<{ personaId: string; storeId: string; orderId: string }>;
}

async function getOrderData(
  personaId: string,
  storeId: string,
  orderId: string
): Promise<OrderDetail> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    personaId,
    "stores",
    storeId,
    "orders",
    `${orderId}.json`
  );
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
}

async function getPersonaName(personaId: string): Promise<string> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    personaId,
    "profile.json"
  );
  const data = await fs.readFile(filePath, "utf-8");
  const profile: PersonaProfile = JSON.parse(data);
  return profile.name;
}

async function getStoreName(personaId: string, storeId: string): Promise<string> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    personaId,
    "stores",
    storeId,
    "index.json"
  );
  const data = await fs.readFile(filePath, "utf-8");
  const store: StoreIndex = JSON.parse(data);
  return store.store_name;
}

async function getAllParams(): Promise<
  { personaId: string; storeId: string; orderId: string }[]
> {
  const fs = await import("fs/promises");
  const path = await import("path");

  const indexPath = path.join(process.cwd(), "public", "data", "index.json");
  const indexData = await fs.readFile(indexPath, "utf-8");
  const index: IndexData = JSON.parse(indexData);

  const params: { personaId: string; storeId: string; orderId: string }[] = [];

  for (const persona of index.personas) {
    const profilePath = path.join(
      process.cwd(),
      "public",
      "data",
      persona.id,
      "profile.json"
    );
    const profileData = await fs.readFile(profilePath, "utf-8");
    const profile: PersonaProfile = JSON.parse(profileData);

    for (const store of profile.stores) {
      const storeIndexPath = path.join(
        process.cwd(),
        "public",
        "data",
        persona.id,
        "stores",
        store.id,
        "index.json"
      );
      const storeIndexData = await fs.readFile(storeIndexPath, "utf-8");
      const storeIndex: StoreIndex = JSON.parse(storeIndexData);

      // Collect all order IDs from categories (new structure)
      if (storeIndex.categories && storeIndex.categories.length > 0) {
        for (const category of storeIndex.categories) {
          for (const item of category.items) {
            params.push({
              personaId: persona.id,
              storeId: store.id,
              orderId: item.order_id,
            });
          }
        }
      } else if (storeIndex.items) {
        // Fallback to items array for backward compatibility
        for (const item of storeIndex.items) {
          params.push({
            personaId: persona.id,
            storeId: store.id,
            orderId: item.order_id,
          });
        }
      }
    }
  }

  return params;
}

export async function generateStaticParams() {
  return await getAllParams();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusClass(status: string): string {
  const normalized = status.toLowerCase().replace(/[^a-z]/g, "_");
  return `badge badge-${normalized}`;
}

function getOrderTypeLabel(type?: string): string {
  const labels: Record<string, string> = {
    order: "Order",
    purchase: "Purchase",
    booking: "Booking",
    tour: "Tour",
    inquiry: "Inquiry",
    test_drive: "Test Drive",
    subscription: "Subscription",
    grooming: "Grooming Appointment",
    pet_profile: "Pet Profile",
    preorder: "Custom Order",
    wishlist: "Wishlist Item",
    saved_property: "Saved Property",
  };
  return labels[type || "order"] || "Order";
}

export default async function OrderPage({ params }: PageProps) {
  const { personaId, storeId, orderId } = await params;
  const order = await getOrderData(personaId, storeId, orderId);
  const personaName = await getPersonaName(personaId);
  const storeName = await getStoreName(personaId, storeId);

  const isPetProfile = order.type === "pet_profile";
  const isSubscription = order.type === "subscription";
  const isGrooming = order.type === "grooming";
  const isPreorder = order.type === "preorder";
  const isWishlist = order.type === "wishlist";
  const isProperty = order.type === "tour" || order.type === "saved_property";
  const hasCost = order.total > 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href="/personas">Personas</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href={`/personas/${personaId}`}>{personaName}</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href={`/personas/${personaId}/store/${storeId}`}>{storeName}</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current font-mono">{order.order_id}</span>
      </nav>

      {/* Order Header */}
      <div className="card-static p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-mono font-bold">{order.order_id}</h1>
              <span className={getStatusClass(order.status)}>{order.status}</span>
            </div>
            <p className="text-[var(--muted)] mt-2">
              {order.type && (
                <span className="mr-2">{getOrderTypeLabel(order.type)} • </span>
              )}
              {order.created_at ? `Created ${formatDateTime(order.created_at)}` : ""}
            </p>
          </div>
          {hasCost && (
            <div className="text-right">
              <div className="text-2xl font-bold">{formatCurrency(order.total)}</div>
              <div className="text-sm text-[var(--muted)]">{order.currency}</div>
            </div>
          )}
        </div>

        {/* Order Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[var(--border)]">
          <div>
            <div className="text-2xl font-bold text-[var(--accent)]">
              {order.items.length}
            </div>
            <div className="text-sm text-[var(--muted)]">
              {isPetProfile ? "Pet" : isGrooming ? "Service" : "Items"}
            </div>
          </div>
          {hasCost && (
            <div>
              <div className="text-2xl font-bold text-[var(--accent)]">
                {formatCurrency(order.total)}
              </div>
              <div className="text-sm text-[var(--muted)]">
                {isSubscription ? "Per Delivery" : "Total"}
              </div>
            </div>
          )}
          {order.type && (
            <div>
              <div className="text-xl font-bold text-[var(--accent)] capitalize">
                {getOrderTypeLabel(order.type)}
              </div>
              <div className="text-sm text-[var(--muted)]">Type</div>
            </div>
          )}
          {order.confirmation_code && (
            <div>
              <div className="text-lg font-mono font-bold text-[var(--accent)]">
                {order.confirmation_code}
              </div>
              <div className="text-sm text-[var(--muted)]">Confirmation</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2">
          <h3 className="section-header">
            {isPetProfile ? "Pet Information" : isGrooming ? "Service Details" : isSubscription ? "Subscription Details" : "Items"}
          </h3>
          <div className="card-static overflow-hidden">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="p-4 border-b border-[var(--border)] last:border-b-0"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    {!isPetProfile && (
                      <div className="text-sm text-[var(--muted)] mt-1 font-mono">
                        {item.product_id}
                      </div>
                    )}

                    {/* Standard order fields */}
                    {item.category && (
                      <span className="tag mt-2">{item.category}</span>
                    )}
                    {item.seats && (
                      <div className="mt-2">
                        <span className="text-sm text-[var(--muted)]">Seats: </span>
                        <span className="font-mono">{item.seats}</span>
                      </div>
                    )}

                    {/* Subscription fields */}
                    {item.description && (
                      <div className="text-sm text-[var(--muted)] mt-2">{item.description}</div>
                    )}
                    {item.recipient && (
                      <div className="mt-2">
                        <span className="text-sm text-[var(--muted)]">Recipient: </span>
                        <span>{item.recipient}</span>
                      </div>
                    )}
                    {item.frequency && (
                      <div className="mt-1">
                        <span className="text-sm text-[var(--muted)]">Frequency: </span>
                        <span className="capitalize">{item.frequency}</span>
                      </div>
                    )}
                    {item.next_delivery && (
                      <div className="mt-1">
                        <span className="text-sm text-[var(--muted)]">Next Delivery: </span>
                        <span>{item.next_delivery}</span>
                      </div>
                    )}
                    {item.bean_preference && (
                      <div className="mt-1">
                        <span className="text-sm text-[var(--muted)]">Bean: </span>
                        <span>{item.bean_preference}</span>
                      </div>
                    )}

                    {/* Grooming fields */}
                    {item.pet_name && (
                      <div className="mt-2">
                        <span className="text-sm text-[var(--muted)]">Pet: </span>
                        <span className="font-medium">{item.pet_name}</span>
                        {item.pet_type && <span className="text-[var(--muted)]"> ({item.pet_type})</span>}
                      </div>
                    )}
                    {item.pet_breed && (
                      <div className="mt-1">
                        <span className="text-sm text-[var(--muted)]">Breed: </span>
                        <span>{item.pet_breed}</span>
                      </div>
                    )}
                    {item.duration_minutes && (
                      <div className="mt-1">
                        <span className="text-sm text-[var(--muted)]">Duration: </span>
                        <span>{item.duration_minutes} minutes</span>
                      </div>
                    )}

                    {/* Property fields (Zillow) */}
                    {isProperty && (
                      <div className="mt-2 space-y-1">
                        {item.price > 0 && (
                          <div>
                            <span className="text-sm text-[var(--muted)]">Price: </span>
                            <span className="font-medium">{formatCurrency(item.price)}</span>
                          </div>
                        )}
                        {item.home_type && (
                          <div>
                            <span className="text-sm text-[var(--muted)]">Type: </span>
                            <span>{item.home_type}</span>
                          </div>
                        )}
                        {(item.bedrooms || item.bathrooms) && (
                          <div>
                            {item.bedrooms && <span>{item.bedrooms} bed</span>}
                            {item.bedrooms && item.bathrooms && <span> • </span>}
                            {item.bathrooms && <span>{item.bathrooms} bath</span>}
                          </div>
                        )}
                        {item.sqft && (
                          <div>
                            <span className="text-sm text-[var(--muted)]">Size: </span>
                            <span>{Number(item.sqft).toLocaleString()} sqft</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Wishlist fields */}
                    {isWishlist && (
                      <div className="mt-2 space-y-1">
                        {item.child_name && (
                          <div>
                            <span className="text-sm text-[var(--muted)]">For: </span>
                            <span className="font-medium">{item.child_name}</span>
                          </div>
                        )}
                        {item.occasion && (
                          <div>
                            <span className="text-sm text-[var(--muted)]">Occasion: </span>
                            <span>{item.occasion}</span>
                          </div>
                        )}
                        {item.priority && (
                          <div>
                            <span className="text-sm text-[var(--muted)]">Priority: </span>
                            <span className="capitalize">{item.priority}</span>
                          </div>
                        )}
                        {item.price > 0 && (
                          <div>
                            <span className="text-sm text-[var(--muted)]">Price: </span>
                            <span>{formatCurrency(item.price)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pet profile fields */}
                    {isPetProfile && (
                      <div className="mt-2 space-y-1">
                        {item.pet_type && (
                          <div>
                            <span className="text-sm text-[var(--muted)]">Type: </span>
                            <span>{item.pet_type}</span>
                          </div>
                        )}
                        {item.pet_breed && (
                          <div>
                            <span className="text-sm text-[var(--muted)]">Breed: </span>
                            <span>{item.pet_breed}</span>
                          </div>
                        )}
                        {item.age_years && (
                          <div>
                            <span className="text-sm text-[var(--muted)]">Age: </span>
                            <span>{item.age_years} years</span>
                          </div>
                        )}
                        {item.weight_lbs && (
                          <div>
                            <span className="text-sm text-[var(--muted)]">Weight: </span>
                            <span>{item.weight_lbs} lbs</span>
                          </div>
                        )}
                        {item.dietary_restrictions && (
                          <div>
                            <span className="text-sm text-[var(--muted)]">Diet: </span>
                            <span>{item.dietary_restrictions}</span>
                          </div>
                        )}
                        {item.notes && (
                          <div className="mt-2 text-sm text-[var(--muted)] italic">{item.notes}</div>
                        )}
                      </div>
                    )}
                  </div>
                  {hasCost && !isPetProfile && (
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(item.subtotal)}</div>
                      {item.quantity > 1 && (
                        <div className="text-sm text-[var(--muted)]">
                          {item.quantity} × {formatCurrency(item.price)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="card-static p-4">
              <h3 className="section-header">Shipping Address</h3>
              <p className="text-sm">{order.shipping_address}</p>
            </div>
          )}

          {/* Pickup Info (for preorders) */}
          {isPreorder && (order.pickup_date || order.pickup_time) && (
            <div className="card-static p-4">
              <h3 className="section-header">Pickup Details</h3>
              <div className="space-y-0">
                {order.pickup_date && (
                  <div className="info-row">
                    <span className="info-label">Date</span>
                    <span className="info-value text-sm">{order.pickup_date}</span>
                  </div>
                )}
                {order.pickup_time && (
                  <div className="info-row">
                    <span className="info-label">Time</span>
                    <span className="info-value text-sm">{order.pickup_time}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grooming Appointment Info */}
          {isGrooming && (order.appointment_date || order.appointment_time) && (
            <div className="card-static p-4">
              <h3 className="section-header">Appointment</h3>
              <div className="space-y-0">
                {order.appointment_date && (
                  <div className="info-row">
                    <span className="info-label">Date</span>
                    <span className="info-value text-sm">{order.appointment_date}</span>
                  </div>
                )}
                {order.appointment_time && (
                  <div className="info-row">
                    <span className="info-label">Time</span>
                    <span className="info-value text-sm">{order.appointment_time}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Special Instructions (for preorders) */}
          {order.special_instructions && (
            <div className="card-static p-4">
              <h3 className="section-header">Special Instructions</h3>
              <p className="text-sm text-[var(--muted)]">{order.special_instructions}</p>
            </div>
          )}

          {/* Dates */}
          {(order.created_at || order.shipped_at || order.delivered_at || order.scheduled_time) && !isPetProfile && (
            <div className="card-static p-4">
              <h3 className="section-header">Timeline</h3>
              <div className="space-y-0">
                {order.created_at && (
                  <div className="info-row">
                    <span className="info-label">Created</span>
                    <span className="info-value text-sm">
                      {formatDateTime(order.created_at)}
                    </span>
                  </div>
                )}
                {order.shipped_at && (
                  <div className="info-row">
                    <span className="info-label">Shipped</span>
                    <span className="info-value text-sm">
                      {formatDateTime(order.shipped_at)}
                    </span>
                  </div>
                )}
                {order.delivered_at && (
                  <div className="info-row">
                    <span className="info-label">Delivered</span>
                    <span className="info-value text-sm">
                      {formatDateTime(order.delivered_at)}
                    </span>
                  </div>
                )}
                {order.scheduled_time && (
                  <div className="info-row">
                    <span className="info-label">Scheduled</span>
                    <span className="info-value text-sm">
                      {formatDateTime(order.scheduled_time)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message (for inquiries) */}
          {order.message && (
            <div className="card-static p-4">
              <h3 className="section-header">Message</h3>
              <p className="text-sm text-[var(--muted)]">{order.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
