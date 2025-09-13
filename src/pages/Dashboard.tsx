import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { DashboardStats, FeedingEntry, WeightEntry, Pet, Food } from '../types';
import { Heart, Utensils, Scale, Calendar, ChevronDown } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const { t, formatNumber, formatDateTime } = useLanguage();
  const [pets, setPets] = useState<Pet[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [showFeedingForm, setShowFeedingForm] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalPets: 0,
    todayFeedings: 0,
    todayCalories: 0,
    recentWeightTrend: 'no-data'
  });
  const [recentFeedings, setRecentFeedings] = useState<FeedingEntry[]>([]);
  const [weightData, setWeightData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weightFormData, setWeightFormData] = useState({
    weight: '',
    notes: '',
    weighed_at: ''
  });
  const [feedingFormData, setFeedingFormData] = useState({
    food_id: '',
    amount_put_out: '',
    amount_not_eaten: '',
    amount_refilled: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPetId) {
      loadDashboardData();
    }
  }, [selectedPetId]);

  const loadInitialData = async () => {
    try {
      const [{ data: petsData }, { data: foodsData }] = await Promise.all([
        supabase
        .from('pets')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false }),
        supabase
        .from('foods')
        .select('*')
        .eq('user_id', user!.id)
        .order('name')
      ]);

      setPets(petsData || []);
      setFoods(foodsData || []);
      
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

  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPetId) return;
    
    try {
      const weightData = {
        pet_id: selectedPetId,
        weight: parseFloat(weightFormData.weight.replace(',', '.')),
        notes: weightFormData.notes || null,
        user_id: user!.id,
        weighed_at: weightFormData.weighed_at ? new Date(weightFormData.weighed_at).toISOString() : new Date().toISOString()
      };

      const { error } = await supabase
        .from('weight_entries')
        .insert([weightData]);
      
      if (error) throw error;

      setShowWeightForm(false);
      setWeightFormData({ weight: '', notes: '', weighed_at: '' });
      loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error saving weight entry:', error);
    }
  };

  const handleAddWeight = (pet: Pet) => {
    setWeightFormData({ 
      weight: '', 
      notes: '', 
      weighed_at: getCurrentDateTime() 
    });
    setShowWeightForm(true);
  };

  const calculateActualConsumed = (putOut: number, notEaten: number = 0, refilled: number = 0) => {
    return putOut + refilled - notEaten;
  };

  const calculateCalories = (actualConsumed: number, food: Food) => {
    if (!food.calories_per_gram) return null;
    return actualConsumed * food.calories_per_gram;
  };

  const handleFeedingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPetId) return;
    
    try {
      const putOut = parseFloat(feedingFormData.amount_put_out.replace(',', '.'));
      const notEaten = feedingFormData.amount_not_eaten ? parseFloat(feedingFormData.amount_not_eaten.replace(',', '.')) : 0;
      const refilled = feedingFormData.amount_refilled ? parseFloat(feedingFormData.amount_refilled.replace(',', '.')) : 0;
      const actualConsumed = calculateActualConsumed(putOut, notEaten, refilled);
      
      const selectedFood = foods.find(f => f.id === feedingFormData.food_id);
      const caloriesConsumed = selectedFood ? calculateCalories(actualConsumed, selectedFood) : null;

      const feedingData = {
        pet_id: selectedPetId,
        food_id: feedingFormData.food_id,
        amount_put_out: putOut,
        amount_not_eaten: notEaten || null,
        amount_refilled: refilled || null,
        actual_consumed: actualConsumed,
        calories_consumed: caloriesConsumed,
        fed_at: new Date().toISOString(),
        notes: feedingFormData.notes || null,
        user_id: user!.id
      };

      const { error } = await supabase
        .from('feeding_entries')
        .insert([feedingData]);
      
      if (error) throw error;

      setShowFeedingForm(false);
      setFeedingFormData({
        food_id: '',
        amount_put_out: '',
        amount_not_eaten: '',
        amount_refilled: '',
        notes: ''
      });
      loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error saving feeding:', error);
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

      {/* Selected Pet Info with Actions */}
      {selectedPet && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
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
            <div className="flex space-x-2">
              <button
                onClick={() => handleAddWeight(selectedPet)}
                className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Scale className="w-4 h-4 mr-1" />
                {t('dashboard.addWeight')}
              </button>
              <button
                onClick={() => setShowFeedingForm(true)}
                className="flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <Utensils className="w-4 h-4 mr-1" />
                {t('dashboard.addFeeding')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weight Entry Form Modal */}
      {showWeightForm && selectedPet && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('dashboard.addWeightFor')} {selectedPet.name}
            </h2>
            <form onSubmit={handleWeightSubmit} className="space-y-4">
              <div>
                <label className="label">{t('dashboard.weightKg')} *</label>
                <input
                  type="number"
                  step="0.1"
                  value={weightFormData.weight}
                  onChange={(e) => setWeightFormData({ ...weightFormData, weight: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">{t('dashboard.weighedAt')}</label>
                <input
                  type="datetime-local"
                  value={weightFormData.weighed_at}
                  onChange={(e) => setWeightFormData({ ...weightFormData, weighed_at: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">{t('feeding.notes')}</label>
                <textarea
                  value={weightFormData.notes}
                  onChange={(e) => setWeightFormData({ ...weightFormData, notes: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder={t('dashboard.optionalNotes')}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {t('dashboard.addWeight')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowWeightForm(false);
                    setWeightFormData({ weight: '', notes: '', weighed_at: '' });
                  }}
                  className="btn-secondary flex-1"
                >
                  {t('pets.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feeding Entry Form Modal */}
      {showFeedingForm && selectedPet && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('dashboard.addFeedingFor')} {selectedPet.name}
            </h2>
            <form onSubmit={handleFeedingSubmit} className="space-y-4">
              <div>
                <label className="label">{t('feeding.food')} *</label>
                <select
                  value={feedingFormData.food_id}
                  onChange={(e) => setFeedingFormData({ ...feedingFormData, food_id: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">{t('feeding.selectFood')}</option>
                  {foods.map((food) => (
                    <option key={food.id} value={food.id}>
                      {food.name} {food.brand && `(${food.brand})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">{t('feeding.amountPutOut')} *</label>
                <input
                  type="number"
                  step="0.1"
                  value={feedingFormData.amount_put_out}
                  onChange={(e) => setFeedingFormData({ ...feedingFormData, amount_put_out: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">{t('feeding.amountNotEaten')}</label>
                <input
                  type="number"
                  step="0.1"
                  value={feedingFormData.amount_not_eaten}
                  onChange={(e) => setFeedingFormData({ ...feedingFormData, amount_not_eaten: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">{t('feeding.amountRefilled')}</label>
                <input
                  type="number"
                  step="0.1"
                  value={feedingFormData.amount_refilled}
                  onChange={(e) => setFeedingFormData({ ...feedingFormData, amount_refilled: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">{t('feeding.notes')}</label>
                <textarea
                  value={feedingFormData.notes}
                  onChange={(e) => setFeedingFormData({ ...feedingFormData, notes: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {t('dashboard.addFeeding')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFeedingForm(false);
                    setFeedingFormData({
                      food_id: '',
                      amount_put_out: '',
                      amount_not_eaten: '',
                      amount_refilled: '',
                      notes: ''
                    });
                  }}
                  className="btn-secondary flex-1"
                >
                  {t('pets.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                      {formatDateTime(feeding.fed_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatNumber(feeding.actual_consumed || 0)}{t('common.grams')}
                    </p>
                    {feeding.calories_consumed && (
                      <p className="text-xs text-gray-500">
                        {formatNumber(feeding.calories_consumed, 0)} {t('common.cal')}
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