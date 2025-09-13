import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { Pet, FeedingEntry, WeightEntry, DashboardStats } from '../types';
import { Heart, Scale, Utensils, TrendingUp, Calendar, Plus } from 'lucide-react';
import { format, isToday, subDays, differenceInYears, differenceInMonths } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const { t, formatNumber, formatDateTime } = useLanguage();
  const [pets, setPets] = useState<Pet[]>([]);
  const [allWeightEntries, setAllWeightEntries] = useState<WeightEntry[]>([]);
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [selectedPetForWeight, setSelectedPetForWeight] = useState<Pet | null>(null);
  const [weightFormData, setWeightFormData] = useState({
    weight: '',
    weighed_at: getCurrentDateTime(),
    notes: ''
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalPets: 0,
    todayFeedings: 0,
    todayCalories: 0,
    recentWeightTrend: 'no-data'
  });
  const [recentFeedings, setRecentFeedings] = useState<FeedingEntry[]>([]);
  const [recentWeights, setRecentWeights] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);

  function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  const getLatestWeight = (petId: string) => {
    return allWeightEntries
      .filter(entry => entry.pet_id === petId)
      .sort((a, b) => new Date(b.weighed_at).getTime() - new Date(a.weighed_at).getTime())[0];
  };

  const getAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    const years = differenceInYears(now, birth);
    const months = differenceInMonths(now, birth) % 12;
    
    if (years > 0) {
      return `${years}y ${months}m`;
    }
    return `${months}m`;
  };

  const handleAddWeight = (pet: Pet) => {
    setSelectedPetForWeight(pet);
    setWeightFormData({
      weight: '',
      weighed_at: getCurrentDateTime(),
      notes: ''
    });
    setShowWeightForm(true);
  };

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetForWeight || !weightFormData.weight) return;

    try {
      const { error } = await supabase
        .from('weight_entries')
        .insert({
          user_id: user!.id,
          pet_id: selectedPetForWeight.id,
          weight: parseFloat(weightFormData.weight),
          weighed_at: weightFormData.weighed_at,
          notes: weightFormData.notes || null
        });

      if (error) throw error;

      setShowWeightForm(false);
      setSelectedPetForWeight(null);
      loadDashboardData(); // Reload data
    } catch (error) {
      console.error('Error adding weight entry:', error);
    }
  };

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
        .select('*')
        .eq('user_id', user!.id);

      // Load all weight entries
      const { data: weightEntries } = await supabase
        .from('weight_entries')
        .select('*')
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
      setPets(pets || []);
      setAllWeightEntries(weightEntries || []);
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

      <div>
        {/* Pet Cards with Action Buttons */}
        {pets.length === 0 ? (
          <div className="text-center py-12">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            {pets.map((pet) => {
              const latestWeight = getLatestWeight(pet.id);
              
              return (
                <div key={pet.id} className="card w-full">
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

          {/* Recent Feedings */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dashboard.recentFeedings')}</h2>
            {recentFeedings.length === 0 ? (
              <div className="card text-center py-8">
                <Utensils className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">{t('dashboard.noRecentFeedings')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentFeedings.map((feeding) => (
                  <div key={feeding.id} className="card">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">{feeding.pet?.name}</h4>
                          <span className="text-sm text-gray-500">{feeding.food?.name}</span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <span>{formatNumber(feeding.actual_consumed || 0)}{t('common.grams')} consumed</span>
                          {feeding.calories_consumed && (
                            <span>{formatNumber(feeding.calories_consumed, 0)} {t('common.cal')}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{formatDateTime(feeding.fed_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Weight Entry Form Modal */}
      {showWeightForm && selectedPetForWeight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {t('weights.addWeight')} - {selectedPetForWeight.name}
            </h3>
            <form onSubmit={handleWeightSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('weights.weight')} ({t('common.kg')})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={weightFormData.weight}
                  onChange={(e) => setWeightFormData(prev => ({ ...prev, weight: e.target.value }))}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('weights.weighedAt')}
                </label>
                <input
                  type="datetime-local"
                  value={weightFormData.weighed_at}
                  onChange={(e) => setWeightFormData(prev => ({ ...prev, weighed_at: e.target.value }))}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('common.notes')}
                </label>
                <textarea
                  value={weightFormData.notes}
                  onChange={(e) => setWeightFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="input"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWeightForm(false)}
                  className="btn-secondary flex-1"
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}