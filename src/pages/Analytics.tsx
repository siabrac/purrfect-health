import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Pet, FeedingEntry, WeightEntry } from '../types';
import { Calendar, TrendingUp, Scale, Utensils } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function Analytics() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | '3months'>('month');
  const [weightData, setWeightData] = useState<any[]>([]);
  const [calorieData, setCalorieData] = useState<any[]>([]);
  const [foodDistribution, setFoodDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPets();
    }
  }, [user]);

  useEffect(() => {
    if (user && pets.length > 0) {
      loadAnalyticsData();
    }
  }, [user, pets, selectedPet, timeRange]);

  const loadPets = async () => {
    try {
      const { data } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', user!.id)
        .order('name');

      setPets(data || []);
    } catch (error) {
      console.error('Error loading pets:', error);
    }
  };

  const getDaysBack = () => {
    switch (timeRange) {
      case 'week': return 7;
      case 'month': return 30;
      case '3months': return 90;
      default: return 30;
    }
  };

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const daysBack = getDaysBack();
      const startDate = subDays(new Date(), daysBack);

      // Build query conditions
      let weightQuery = supabase
        .from('weight_entries')
        .select('*, pet:pets(*)')
        .eq('user_id', user!.id)
        .gte('weighed_at', startDate.toISOString())
        .order('weighed_at', { ascending: true });

      let feedingQuery = supabase
        .from('feeding_entries')
        .select('*, pet:pets(*), food:foods(*)')
        .eq('user_id', user!.id)
        .gte('fed_at', startDate.toISOString())
        .order('fed_at', { ascending: true });

      if (selectedPet !== 'all') {
        weightQuery = weightQuery.eq('pet_id', selectedPet);
        feedingQuery = feedingQuery.eq('pet_id', selectedPet);
      }

      const [{ data: weightEntries }, { data: feedingEntries }] = await Promise.all([
        weightQuery,
        feedingQuery
      ]);

      // Process weight data
      const processedWeightData = weightEntries?.map(entry => ({
        date: format(new Date(entry.weighed_at), 'MMM dd'),
        weight: entry.weight,
        petName: entry.pet?.name,
        fullDate: entry.weighed_at
      })) || [];

      // Process calorie data - group by day
      const caloriesByDay = new Map();
      feedingEntries?.forEach(feeding => {
        const day = format(new Date(feeding.fed_at), 'MMM dd');
        const calories = feeding.calories_consumed || 0;
        caloriesByDay.set(day, (caloriesByDay.get(day) || 0) + calories);
      });

      const processedCalorieData = Array.from(caloriesByDay.entries()).map(([date, calories]) => ({
        date,
        calories: Math.round(calories)
      }));

      // Process food distribution
      const foodCounts = new Map();
      feedingEntries?.forEach(feeding => {
        const foodName = feeding.food?.name || 'Unknown';
        const amount = feeding.actual_consumed || 0;
        foodCounts.set(foodName, (foodCounts.get(foodName) || 0) + amount);
      });

      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
      const processedFoodData = Array.from(foodCounts.entries())
        .map(([name, amount], index) => ({
          name,
          value: Math.round(amount),
          color: colors[index % colors.length]
        }))
        .sort((a, b) => b.value - a.value);

      setWeightData(processedWeightData);
      setCalorieData(processedCalorieData);
      setFoodDistribution(processedFoodData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Track your pets' weight trends and feeding patterns</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <label className="label">Pet</label>
          <select
            value={selectedPet}
            onChange={(e) => setSelectedPet(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="all">All Pets</option>
            {pets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Time Range</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="input w-full sm:w-48"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="3months">Last 3 Months</option>
          </select>
        </div>
      </div>

      {pets.length === 0 ? (
        <div className="text-center py-12">
          <Scale className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pets found</h3>
          <p className="mt-1 text-sm text-gray-500">Add some pets to see analytics.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weight Trends */}
          <div className="card">
            <div className="flex items-center mb-4">
              <Scale className="w-5 h-5 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Weight Trends</h2>
            </div>
            {weightData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No weight data available</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [`${value} kg`, 'Weight']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Daily Calories */}
          <div className="card">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-5 h-5 text-orange-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Daily Calories</h2>
            </div>
            {calorieData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No calorie data available</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={calorieData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [`${value} cal`, 'Calories']}
                    />
                    <Bar dataKey="calories" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Food Distribution */}
          <div className="card lg:col-span-2">
            <div className="flex items-center mb-4">
              <Utensils className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Food Distribution</h2>
            </div>
            {foodDistribution.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No feeding data available</p>
            ) : (
              <div className="flex flex-col lg:flex-row items-center">
                <div className="h-64 w-full lg:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={foodDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                      >
                        {foodDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}g`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full lg:w-1/2 lg:pl-6">
                  <div className="space-y-2">
                    {foodDistribution.map((food, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded mr-3"
                            style={{ backgroundColor: food.color }}
                          />
                          <span className="text-sm text-gray-700">{food.name}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{food.value}g</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}