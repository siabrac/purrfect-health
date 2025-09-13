import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { Pet, FeedingEntry, WeightEntry, DashboardStats } from '../types';
import { Heart, Scale, Utensils, TrendingUp, Calendar, Plus } from 'lucide-react';
import { format, isToday, subDays } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const { t, formatNumber, formatDateTime } = useLanguage();
  const [stats, setStats] = useState<DashboardStats>({
    totalPets: 0,
    todayFeedings: 0,
    todayCalories: 0,
    recentWeightTrend: 'no-data'
  });
  const [recentFeedings, setRecentFeedings] = useState<FeedingEntry[]>([]);
  const [recentWeights, setRecentWeights] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Load pets count
      const { data: pets } = await supabase
        .from('pets')
        .select('id')
        .eq('user_id', user!.id);

      // Load today's feedings
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const { data: todayFeedings } = await supabase
        .from('feeding_entries')
        .select('calories_consumed')
        .eq('user_id', user!.id)
        .gte('fed_at', startOfDay.toISOString())
        .lte('fed_at', endOfDay.toISOString());

      // Load recent feedings
      const { data: feedingsData } = await supabase
        .from('feeding_entries')
        .select(`
          *,
          pet:pets(*),
          food:foods(*)
        `)
        .eq('user_id', user!.id)
        .order('fed_at', { ascending: false })
        .limit(5);

      // Load recent weights
      const { data: weightsData } = await supabase
        .from('weight_entries')
        .select(`
          *,
          pet:pets(*)
        `)
        .eq('user_id', user!.id)
        .order('weighed_at', { ascending: false })
        .limit(5);

      // Calculate stats
      const totalCalories = todayFeedings?.reduce((sum, feeding) => 
        sum + (feeding.calories_consumed || 0), 0) || 0;

      setStats({
        totalPets: pets?.length || 0,
        todayFeedings: todayFeedings?.length || 0,
        todayCalories: totalCalories,
        recentWeightTrend: 'stable' // Simplified for now
      });

      setRecentFeedings(feedingsData || []);
      setRecentWeights(weightsData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <p className="text-gray-600">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Heart className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('dashboard.totalPets')}</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalPets}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Utensils className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('dashboard.todayFeedings')}</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.todayFeedings}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('dashboard.todayCalories')}</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.todayCalories, 0)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Scale className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('dashboard.weightTrend')}</p>
              <p className="text-2xl font-semibold text-gray-900 capitalize">{t(`dashboard.trend.${stats.recentWeightTrend}`)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pet Cards with Action Buttons */}
        {pets.length === 0 ? (
          <div className="lg:col-span-2 text-center py-12">
            <Heart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('pets.noPets')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('pets.noPetsDescription')}</p>
            <div className="mt-6">
              <a href="/pets" className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                {t('pets.addPet')}
              </a>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {pets.map((pet) => {
              const latestWeight = getLatestWeight(pet.id);
              
              return (
                <div key={pet.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{pet.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{t(`species.${pet.species}`)}</p>
                      {pet.breed && (
                        <p className="text-sm text-gray-500">{pet.breed}</p>
                      )}
                      {pet.birth_date && (
                        <p className="text-sm text-gray-500">
                          {t('pets.age')}: {getAge(pet.birth_date)}
                        </p>
                      )}
                      {pet.target_weight && (
                        <p className="text-sm text-gray-500">
                          {t('pets.target')}: {pet.target_weight}{t('common.kg')}
                        </p>
                      )}
                      {latestWeight && (
                        <p className="text-sm text-gray-500">
                          Current: {formatNumber(latestWeight.weight)}{t('common.kg')} 
                          <span className="text-xs text-gray-400 ml-1">
                            ({formatDateTime(latestWeight.weighed_at)})
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleAddWeight(pet)}
                      className="flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      <Scale className="w-4 h-4 mr-2" />
                      {t('dashboard.addWeight')}
                    </button>
                    <a
                      href="/feeding"
                      className="flex items-center justify-center px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                    >
                      <Utensils className="w-4 h-4 mr-2" />
                      {t('dashboard.addFeeding')}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}