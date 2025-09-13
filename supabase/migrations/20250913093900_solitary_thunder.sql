/*
  # Pet Food and Weight Tracker Schema

  1. New Tables
    - `pets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `species` (text)
      - `breed` (text, optional)
      - `birth_date` (date, optional)
      - `target_weight` (decimal, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `foods`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `brand` (text, optional)
      - `calories_per_gram` (decimal, optional)
      - `protein_per_gram` (decimal, optional)
      - `fat_per_gram` (decimal, optional)
      - `carbs_per_gram` (decimal, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `feeding_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `pet_id` (uuid, references pets)
      - `food_id` (uuid, references foods)
      - `amount_put_out` (decimal)
      - `amount_not_eaten` (decimal, optional)
      - `amount_refilled` (decimal, optional)
      - `actual_consumed` (decimal, calculated)
      - `calories_consumed` (decimal, calculated)
      - `fed_at` (timestamp)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `weight_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `pet_id` (uuid, references pets)
      - `weight` (decimal)
      - `weighed_at` (timestamp)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create pets table
CREATE TABLE IF NOT EXISTS pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  species text NOT NULL CHECK (species IN ('dog', 'cat', 'bird', 'rabbit', 'other')),
  breed text,
  birth_date date,
  target_weight decimal(5,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create foods table
CREATE TABLE IF NOT EXISTS foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  brand text,
  calories_per_gram decimal(6,3),
  protein_per_gram decimal(6,3),
  fat_per_gram decimal(6,3),
  carbs_per_gram decimal(6,3),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create feeding_entries table
CREATE TABLE IF NOT EXISTS feeding_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pet_id uuid REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  food_id uuid REFERENCES foods(id) ON DELETE CASCADE NOT NULL,
  amount_put_out decimal(8,2) NOT NULL,
  amount_not_eaten decimal(8,2) DEFAULT 0,
  amount_refilled decimal(8,2) DEFAULT 0,
  actual_consumed decimal(8,2),
  calories_consumed decimal(10,2),
  fed_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create weight_entries table
CREATE TABLE IF NOT EXISTS weight_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pet_id uuid REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  weight decimal(6,2) NOT NULL,
  weighed_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeding_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for pets
CREATE POLICY "Users can manage their own pets"
  ON pets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for foods
CREATE POLICY "Users can manage their own foods"
  ON foods
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for feeding_entries
CREATE POLICY "Users can manage their own feeding entries"
  ON feeding_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for weight_entries
CREATE POLICY "Users can manage their own weight entries"
  ON weight_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS pets_user_id_idx ON pets(user_id);
CREATE INDEX IF NOT EXISTS foods_user_id_idx ON foods(user_id);
CREATE INDEX IF NOT EXISTS feeding_entries_user_id_idx ON feeding_entries(user_id);
CREATE INDEX IF NOT EXISTS feeding_entries_pet_id_idx ON feeding_entries(pet_id);
CREATE INDEX IF NOT EXISTS feeding_entries_fed_at_idx ON feeding_entries(fed_at);
CREATE INDEX IF NOT EXISTS weight_entries_user_id_idx ON weight_entries(user_id);
CREATE INDEX IF NOT EXISTS weight_entries_pet_id_idx ON weight_entries(pet_id);
CREATE INDEX IF NOT EXISTS weight_entries_weighed_at_idx ON weight_entries(weighed_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_foods_updated_at BEFORE UPDATE ON foods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feeding_entries_updated_at BEFORE UPDATE ON feeding_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_weight_entries_updated_at BEFORE UPDATE ON weight_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();