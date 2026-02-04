// Types for persona data

export interface PersonaSummary {
  id: string;
  name: string;
  initials: string;
  profession: string;
  industry: string;
  city: string;
  region: string;
  age_group: string;
  total_orders: number;
  total_spent: number;
}

export interface IndexData {
  personas: PersonaSummary[];
  stats: {
    total_personas: number;
    total_orders: number;
    total_stores: number;
  };
  generated_at: string;
}

export interface Demographics {
  age_group: string;
  gender: string;
  ethnicity: string;
  marital_status: string;
  family_role: string;
}

export interface Professional {
  profession: string;
  industry: string;
  experience_level: string;
}

export interface Location {
  city: string;
  region: string;
  country: string;
  address: string;
}

export interface CategorySummary {
  id: string;
  name: string;
  type: string;
  item_count: number;
  total_spent: number;
  has_cost: boolean;
}

export interface StoreSummary {
  id: string;
  name: string;
  item_count: number;
  total_spent: number;
  transaction_type: string;
  transaction_label: string;
  has_cost: boolean;
  categories?: CategorySummary[];
}

export interface PersonaProfile {
  id: string;
  name: string;
  initials: string;
  demographics: Demographics;
  professional: Professional;
  location: Location;
  personality_traits: string[];
  interests: string[];
  summary: string;
  stores: StoreSummary[];
  stats: {
    total_orders: number;
    total_spent: number;
    stores_count: number;
  };
}

export interface ItemSummary {
  order_id: string;
  display_name?: string;  // For pet profiles, shows pet name
  description?: string;   // Additional description (e.g., breed)
  item_preview?: string;  // Preview of items for small orders (2 or fewer items)
  status: string;
  total: number;
  item_count: number;
  created_at: string;
}

export interface StoreCategory {
  id: string;
  name: string;
  type: string;
  label: string;
  has_cost: boolean;
  summary: {
    total_count: number;
    total_spent: number;
    first_date: string;
    last_date: string;
  };
  items: ItemSummary[];
}

export interface StoreIndex {
  persona_id: string;
  store_id: string;
  store_name: string;
  transaction_type: string;
  transaction_label: string;
  has_cost: boolean;
  summary: {
    total_count: number;
    total_spent: number;
    first_date: string;
    last_date: string;
  };
  items: ItemSummary[];  // For backward compatibility (single-category stores)
  categories: StoreCategory[];  // All categories
}

export interface OrderItem {
  product_id: string;
  name: string;
  category?: string;
  quantity: number;
  price: number;
  subtotal: number;
  // For bookings
  seats?: string;
  showtime?: string;
  theater?: string;
  // For properties
  address?: string;
  // For subscriptions
  description?: string;
  recipient?: string;
  next_delivery?: string;
  frequency?: string;
  bean_preference?: string;
  // For grooming
  pet_name?: string;
  pet_type?: string;
  pet_breed?: string;
  duration_minutes?: string;
  // For pet profiles
  age_years?: string;
  weight_lbs?: string;
  dietary_restrictions?: string;
  notes?: string;
  // For wishlists
  child_name?: string;
  occasion?: string;
  priority?: string;
  // For properties (Zillow)
  city?: string;
  bedrooms?: string;
  bathrooms?: string;
  sqft?: string;
  home_type?: string;
}

export interface OrderDetail {
  order_id: string;
  persona_id: string;
  store_id: string;
  type?: string;
  status: string;
  created_at: string;
  shipped_at?: string;
  delivered_at?: string;
  shipping_address?: string;
  confirmation_code?: string;
  scheduled_time?: string;
  message?: string;
  // For grooming
  appointment_date?: string;
  appointment_time?: string;
  // For preorders
  pickup_date?: string;
  pickup_time?: string;
  special_instructions?: string;
  items: OrderItem[];
  total: number;
  currency: string;
}

// Types for MCP tool data

export interface ToolDefinition {
  name: string;
  title?: string | null;
  description: string;
  inputSchema: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
    title?: string;
  };
  outputSchema?: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
    title?: string;
  };
  annotations?: unknown;
  _meta?: unknown;
}

export interface ToolServerData {
  filename: string;
  name: string;
  tools: ToolDefinition[];
  dataFile?: string;  // Legacy: single data file
  dataFiles?: string[];  // Multiple CSV data files
  dataDir?: string;  // Directory containing data files (e.g., "amazon-shop")
}
