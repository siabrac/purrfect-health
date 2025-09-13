export interface Pet {
  id: string;
  user_id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed?: string;
  birth_date?: string;
  target_weight?: number;
  created_at: string;
  updated_at: string;
}

export interface Food {
  id: string;
  user_id: string;
  name: string;
  brand?: string;
  calories_per_gram?: number;
  protein_per_gram?: number;
  fat_per_gram?: number;
  carbs_per_gram?: number;
  created_at: string;
  updated_at: string;
}

export interface FeedingEntry {
  id: string;
  user_id: string;
  pet_id: string;
  food_id: string;
  amount_put_out: number;
  amount_not_eaten?: number;
  amount_refilled?: number;
  actual_consumed?: number;
  calories_consumed?: number;
  fed_at: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  pet?: Pet;
  food?: Food;
}

export interface WeightEntry {
  id: string;
  user_id: string;
  pet_id: string;
  weight: number;
  weighed_at: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  pet?: Pet;
}

export interface DashboardStats {
  totalPets: number;
  todayFeedings: number;
  todayCalories: number;
  recentWeightTrend: 'up' | 'down' | 'stable' | 'no-data';
}