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
        {/* Recent Feedings */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.recentFeedings')}</h2>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          {recentFeedings.length === 0 ? (
            <p className="text-gray-500 text-center py-4">{t('dashboard.noRecentFeedings')}</p>
          ) : (
            <div className="space-y-3">
              {recentFeedings.map((feeding) => (
                <div key={feeding.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{feeding.pet?.name}</p>
                    <p className="text-sm text-gray-600">{feeding.food?.name}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(feeding.fed_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      {formatNumber(feeding.actual_consumed || 0)}{t('common.grams')}
                    </p>
                    {feeding.calories_consumed && (
                      <p className="text-xs text-orange-600">
                        {formatNumber(feeding.calories_consumed, 0)} {t('common.cal')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Weights */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.recentWeights')}</h2>
            <Scale className="h-5 w-5 text-gray-400" />
          </div>
          {recentWeights.length === 0 ? (
            <p className="text-gray-500 text-center py-4">{t('dashboard.noRecentWeights')}</p>
          ) : (
            <div className="space-y-3">
              {recentWeights.map((weight) => (
                <div key={weight.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{weight.pet?.name}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(weight.weighed_at)}</p>
                    {weight.notes && (
                      <p className="text-xs text-gray-400 italic">{weight.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-blue-600">
                      {formatNumber(weight.weight)}{t('common.kg')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/pets"
            className="flex items-center p-3 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <Heart className="h-6 w-6 text-primary-600 mr-3" />
            <span className="font-medium text-primary-700">{t('dashboard.managePets')}</span>
          </a>
          <a
            href="/foods"
            className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Utensils className="h-6 w-6 text-green-600 mr-3" />
            <span className="font-medium text-green-700">{t('dashboard.manageFoods')}</span>
          </a>
          <a
            href="/feeding"
            className="flex items-center p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <Plus className="h-6 w-6 text-orange-600 mr-3" />
            <span className="font-medium text-orange-700">{t('dashboard.addFeeding')}</span>
          </a>
          <a
            href="/analytics"
            className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <TrendingUp className="h-6 w-6 text-blue-600 mr-3" />
            <span className="font-medium text-blue-700">{t('dashboard.viewAnalytics')}</span>
          </a>
        </div>
      </div>
    </div>
  );
}