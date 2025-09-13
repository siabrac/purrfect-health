import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { DashboardStats, FeedingEntry, WeightEntry, Pet } from '../types';
import { Heart, Utensils, Zap, TrendingUp, Calendar, ChevronDown } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [stats, setStats] = useState<DashboardStats>({
    totalPets: 0,
    todayFeedings: 0,
    todayCalories: 0,
    recentWeightTrend: 'no-data'
  });
  const [recentFeedings, setRecentFeedings] = useState<FeedingEntry[]>([]);
  const [weightData, setWeightData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPets();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPetId) {
      loadDashboardData();
    }
  }, [selectedPetId]);

  const loadPets = async () => {
    try {
      const { data: petsData } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      setPets(petsData || []);
      
      // Auto-select the first pet if only one exists
      if (petsData && petsData.length > 0) {
        setSelectedPetId(petsData[0].id);
      }
    } catch (error) {
      console.error('Error loading pets:', error);
    }
  };

  const loadDashboardData = async () => {
    if (!selectedPetId) return;
    
    try {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);

      // Get selected pet info
      const selectedPet = pets.find(p => p.id === selectedPetId);

      // Get today's feedings
      const { data: todayFeedings, count: feedingsCount } = await supabase
        .from('feeding_entries')
        .select('*, food:foods(*), pet:pets(*)', { count: 'exact' })
        .eq('user_id', user!.id)
        .eq('pet_id', selectedPetId)
        .gte('fed_at', startOfToday.toISOString())
        .lte('fed_at', endOfToday.toISOString())
        .order('fed_at', { ascending: false });

      // Calculate today's calories
      const todayCalories = todayFeedings?.reduce((sum, feeding) => {
        return sum + (feeding.calories_consumed || 0);
      }, 0) || 0;

      // Get recent feedings for the list
      const { data: recentFeedingsData } = await supabase
        .from('feeding_entries')
        .select('*, food:foods(*), pet:pets(*)')
        .eq('user_id', user!.id)
        .eq('pet_id', selectedPetId)
        .order('fed_at', { ascending: false })
        .limit(5);

      // Get weight data for chart (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: weightEntries } = await supabase
        .from('weight_entries')
        .select('*, pet:pets(*)')
        .eq('user_id', user!.id)
        .eq('pet_id', selectedPetId)
        .gte('weighed_at', thirtyDaysAgo.toISOString())
        .order('weighed_at', { ascending: true });

      // Process weight data for chart
      const chartData = weightEntries?.map(entry => ({
        date: format(new Date(entry.weighed_at), 'MMM dd'),
        weight: entry.weight,
        petName: entry.pet?.name
      })) || [];

      setStats({
        totalPets: 1, // Always 1 since we're showing data for one pet
        todayFeedings: feedingsCount || 0,
        todayCalories: Math.round(todayCalories),
        recentWeightTrend: 'stable' // Simplified for now
      });

      setRecentFeedings(recentFeedingsData || []);
      setWeightData(chartData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedPet = pets.find(p => p.id === selectedPetId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-gray-600">{t('dashboard.subtitle')}</p>
        </div>
        <div className="text-center py-12">
          <Heart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('pets.noPets')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('pets.noPetsDescription')}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-gray-600">{t('dashboard.subtitle')}</p>
        </div>
        
        {/* Pet Selector - only show if multiple pets */}
        {pets.length > 1 && (
          <div className="relative">
            <select
              value={selectedPetId}
              onChange={(e) => setSelectedPetId(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Selected Pet Info */}
      {selectedPet && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center">
            <Heart className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-primary-900">
              {selectedPet.name}
            </h2>
            <span className="ml-2 text-sm text-primary-700 capitalize">
              ({t(`species.${selectedPet.species}`)})
            </span>
            {selectedPet.target_weight && (
              <span className="ml-4 text-sm text-primary-600">
                {t('pets.target')}: {selectedPet.target_weight}{t('common.kg')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Heart className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Pet</p>
              <p className="text-lg font-bold text-gray-900">{selectedPet?.name}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Utensils className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('dashboard.todayFeedings')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayFeedings}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Zap className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('dashboard.todayCalories')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayCalories}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('dashboard.weightTrend')}</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">{stats.recentWeightTrend}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Feedings */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.recentFeedings')}</h2>
          {recentFeedings.length === 0 ? (
            <p className="text-gray-500 text-center py-4">{t('dashboard.noRecentFeedings')}</p>
          ) : (
            <div className="space-y-3">
              {recentFeedings.map((feeding) => (
                <div key={feeding.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{feeding.pet?.name}</p>
                    <p className="text-sm text-gray-600">{feeding.food?.name}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(feeding.fed_at), 'MMM dd, h:mm a')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {feeding.actual_consumed}{t('common.grams')}
                    </p>
                    {feeding.calories_consumed && (
                      <p className="text-xs text-gray-500">
                        {Math.round(feeding.calories_consumed)} {t('common.cal')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weight Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.weightTrends')}</h2>
          {weightData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('dashboard.noWeightData')}</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
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
      </div>
    </div>
  );
}