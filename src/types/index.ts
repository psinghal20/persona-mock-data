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

export interface HealthcareCategory {
  id: string;
  name: string;
  count: number;
}

export interface HealthcareServer {
  id: string;
  name: string;
  item_count: number;
  category_count: number;
  primary_category: string;
  categories: HealthcareCategory[];
}

export interface HealthcareData {
  servers: HealthcareServer[];
  stats: {
    total_items: number;
    servers_count: number;
  };
}

// Healthcare server detail page types
export interface HealthcareItem {
  id: string;
  date?: string;
  [key: string]: unknown;  // Dynamic fields based on category type
}

export interface HealthcareCategoryDetail {
  id: string;
  name: string;
  item_count: number;
  items: HealthcareItem[];
}

export interface HealthcareServerIndex {
  persona_id: string;
  server_id: string;
  server_name: string;
  summary: {
    total_items: number;
    category_count: number;
  };
  categories: HealthcareCategoryDetail[];
}

export interface EmbeddedHealthProfile {
  demographics: {
    dob: string;
    gender: string;
    height_cm: number;
    weight_kg: number;
    blood_type?: string;
    race?: { code: string; display: string };
    ethnicity?: { code: string; display: string };
    location?: { city: string; state: string; zip: string };
    contact?: {
      email?: string;
      phone?: string;
      emergency_contact?: string;
      emergency_phone?: string;
    };
  };
  conditions?: HealthCondition[];
  medications?: HealthMedication[];
  allergies?: HealthAllergy[];
  vitals?: HealthVitals;
  body_composition?: HealthBodyComposition;
  glucose?: HealthGlucose;
  fitness?: HealthFitness;
  sleep?: HealthSleep;
  stress_recovery?: HealthStressRecovery;
  nutrition?: HealthNutrition;
  genetics?: HealthGenetics;
  devices?: {
    fitness_tracker?: HealthDevice;
    smart_scale?: HealthDevice;
    cgm?: HealthDevice;
    blood_pressure_monitor?: HealthDevice;
  };
  providers?: {
    primary_care?: HealthProvider;
    specialists?: HealthProvider[];
  };
  insurance?: {
    provider?: string;
    plan?: string;
    member_id?: string;
    group_id?: string;
  };
}

export interface ObsidianFolder {
  name: string;
  note_count: number;
}

export interface ObsidianData {
  total_notes: number;
  folders: ObsidianFolder[];
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
  health_profile?: EmbeddedHealthProfile;
  healthcare?: HealthcareData;
  obsidian?: ObsidianData;
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

// Types for Health Profile data

export interface HealthCondition {
  icd10: string;
  snomed?: string;
  name: string;
  category: string;
  onset: string;
  status: string;
  severity: string;
  provider_ref?: string;
  notes?: string;
  effects?: {
    activity_limit?: string;
    fatigue_increase?: number;
    glucose_impact?: string;
    dietary_restrictions?: string[];
    sleep_impact?: string;
  };
}

export interface HealthMedication {
  name: string;
  brand?: string;
  rxnorm?: string;
  ndc?: string;
  dose: string;
  frequency: string;
  route: string;
  for_condition?: string;
  start_date?: string;
  prescriber_ref?: string;
  pharmacy?: string;
  refills_remaining?: number;
  notes?: string;
}

export interface HealthAllergy {
  allergen: string;
  type: string;
  reaction: string;
  severity: string;
  snomed?: string;
  notes?: string;
}

export interface HealthVitals {
  blood_pressure: {
    systolic: number;
    diastolic: number;
    variance?: number;
  };
  resting_hr: number;
  resting_hr_variance?: number;
  max_hr?: number;
  spo2?: number;
  respiratory_rate?: number;
  temperature_c?: number;
}

export interface HealthBodyComposition {
  body_fat_pct: number;
  muscle_mass_kg: number;
  bone_mass_kg?: number;
  water_pct?: number;
  visceral_fat?: number;
  metabolic_age?: number;
  bmr_kcal?: number;
  trend?: string;
}

export interface HealthGlucose {
  diabetes_status: string;
  a1c?: number;
  uses_cgm: boolean;
  fasting?: {
    mean: number;
    range: number[];
  };
  post_meal?: {
    mean: number;
    range: number[];
    peak_offset_min?: number;
  };
  patterns?: {
    dawn_phenomenon?: string;
    post_meal_spike?: string;
    overnight_stability?: string;
  };
}

export interface HealthFitnessWorkout {
  type: string;
  frequency: number;
  duration_min: number;
  intensity: string;
  preferred_time?: string;
}

export interface HealthFitness {
  level: string;
  vo2_max?: number;
  training_status?: string;
  daily_activity?: {
    steps_target?: number;
    steps_typical?: number[];
    active_minutes_target?: number;
    active_calories_target?: number;
  };
  weekly_workouts?: HealthFitnessWorkout[];
  sports?: {
    primary?: string;
    secondary?: string;
  };
  performance?: {
    running_pace_min_per_km?: number;
    cycling_ftp_watts?: number | null;
  };
}

export interface HealthSleep {
  target_hours: number;
  typical_hours: number[];
  quality: string;
  schedule?: {
    chronotype?: string;
    typical_bedtime?: string;
    typical_wake?: string;
    weekend_shift_hours?: number;
  };
  architecture?: {
    deep_pct?: number;
    rem_pct?: number;
    light_pct?: number;
    awake_pct?: number;
  };
  issues?: string[];
}

export interface HealthStressRecovery {
  stress_level: string;
  stress_score_typical?: number;
  hrv?: {
    baseline_ms: number;
    range: number[];
  };
  recovery?: {
    capacity: string;
    typical_score: number[];
  };
  body_battery?: {
    morning_typical: number;
    evening_typical: number;
  };
}

export interface HealthNutrition {
  diet_type: string;
  calorie_target?: number;
  macros?: {
    protein_pct: number;
    carbs_pct: number;
    fat_pct: number;
  };
  restrictions?: string[];
  hydration?: {
    target_ml: number;
    typical_ml: number[];
  };
  meal_patterns?: {
    meals_per_day: number;
    snacks_per_day: number;
    typical_meal_times?: string[];
  };
}

export interface HealthGenetics {
  ancestry?: Record<string, number>;
  haplogroups?: {
    maternal?: string;
    paternal?: string;
  };
  neanderthal_variants?: number;
  health_risks?: Record<string, number>;
  pharmacogenomics?: Record<string, {
    genotype: string;
    metabolism: string;
  }>;
  carrier_status?: Record<string, boolean>;
}

export interface HealthDevice {
  enabled: boolean;
  brand?: string;
  model?: string;
  device_id?: string;
}

export interface HealthProvider {
  provider_id?: string;
  name: string;
  specialty: string;
  npi?: string;
  department?: string;
}

export interface HealthProfile {
  persona_id: string;
  name: string;
  schema_version: string;
  demographics: {
    dob: string;
    gender: string;
    height_cm: number;
    weight_kg: number;
    blood_type?: string;
    race?: { code: string; display: string };
    ethnicity?: { code: string; display: string };
    location?: { city: string; state: string; zip: string };
    contact?: {
      email?: string;
      phone?: string;
      emergency_contact?: string;
      emergency_phone?: string;
    };
  };
  conditions?: HealthCondition[];
  medications?: HealthMedication[];
  allergies?: HealthAllergy[];
  vitals?: HealthVitals;
  body_composition?: HealthBodyComposition;
  glucose?: HealthGlucose;
  fitness?: HealthFitness;
  sleep?: HealthSleep;
  stress_recovery?: HealthStressRecovery;
  nutrition?: HealthNutrition;
  genetics?: HealthGenetics;
  devices?: {
    fitness_tracker?: HealthDevice;
    smart_scale?: HealthDevice;
    cgm?: HealthDevice;
    blood_pressure_monitor?: HealthDevice;
  };
  providers?: {
    primary_care?: HealthProvider;
    specialists?: HealthProvider[];
  };
  insurance?: {
    provider?: string;
    plan?: string;
    member_id?: string;
    group_id?: string;
  };
}
