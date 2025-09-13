import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { Pet, Food, FeedingEntry } from '../types';
import { Plus, Edit2, Trash2, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function Feeding() {
  const { user } = useAuth();
  const { t, formatNumber, formatDateTime } = useLanguage();
  const [pets, setPets] = useState<Pet[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [feedings, setFeedings] = useState<FeedingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFeeding, setEditingFeeding] = useState<FeedingEntry | null>(null);
  const [lastFeeding, setLastFeeding] = useState<FeedingEntry | null>(null);
  const [formData, setFormData] = useState({
    pet_id: '',
    food_id: '',
    current_bowl_weight: '',
    fed_at: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Load pets
      const { data: petsData } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', user!.id)
        .order('name');

      // Load foods
      const { data: foodsData } = await supabase
        .from('foods')
        .select('*')
        .eq('user_id', user!.id)
        .order('name');

      // Load feeding entries
      const { data: feedingsData } = await supabase
        .from('feeding_entries')
        .select(`
          *,
          pet:pets(*),
          food:foods(*)
        `)
        .eq('user_id', user!.id)
        .order('fed_at', { ascending: false });

      setPets(petsData || []);
      setFoods(foodsData || []);
      setFeedings(feedingsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLastFeeding = async (petId: string, foodId: string) => {
    if (!petId || !foodId) {
      setLastFeeding(null);
      return;
    }

    try {
      const { data } = await supabase
        .from('feeding_entries')
        .select(`
          *,
          pet:pets(*),
          food:foods(*)
        `)
        .eq('user_id', user!.id)
        .eq('pet_id', petId)
        .eq('food_id', foodId)
        .order('fed_at', { ascending: false })
        .limit(1);

      setLastFeeding(data && data.length > 0 ? data[0] : null);
    } catch (error) {
      console.error('Error loading last feeding:', error);
      setLastFeeding(null);
    }
  };

  const calculateActualConsumed = (currentBowlWeight: number, lastBowlWeight: number = 0) => {
    // Bowl weights cancel out, so we just calculate the difference in food weight
    return Math.max(0, lastBowlWeight - currentBowlWeight);
  };

  const calculateCalories = (actualConsumed: number, food: Food) => {
    if (!food.calories_per_gram) return null;
    return actualConsumed * food.calories_per_gram;
  };

  const parseNumber = (value: string): number => {
    return parseFloat(value.replace(',', '.'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const currentBowlWeight = parseNumber(formData.current_bowl_weight);
      const lastBowlWeight = lastFeeding?.amount_put_out || 0;
      const actualConsumed = calculateActualConsumed(currentBowlWeight, lastBowlWeight);
      
      const selectedFood = foods.find(f => f.id === formData.food_id);
      const caloriesConsumed = selectedFood ? calculateCalories(actualConsumed, selectedFood) : null;

      const feedingData = {
        pet_id: formData.pet_id,
        food_id: formData.food_id,
        amount_put_out: currentBowlWeight,
        amount_not_eaten: null,
        amount_refilled: null,
        actual_consumed: actualConsumed,
        calories_consumed: caloriesConsumed,
        fed_at: formData.fed_at || new Date().toISOString(),
        notes: formData.notes || null,
        user_id: user!.id
      };

      if (editingFeeding) {
        const { error } = await supabase
          .from('feeding_entries')
          .update(feedingData)
          .eq('id', editingFeeding.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('feeding_entries')
          .insert([feedingData]);
        if (error) throw error;
      }

      setShowForm(false);
      setEditingFeeding(null);
      setLastFeeding(null);
      setFormData({
        pet_id: '',
        food_id: '',
        current_bowl_weight: '',
        fed_at: '',
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Error saving feeding:', error);
    }
  };

  const handleEdit = (feeding: FeedingEntry) => {
    setEditingFeeding(feeding);
    setFormData({
      pet_id: feeding.pet_id,
      food_id: feeding.food_id,
      current_bowl_weight: feeding.amount_put_out.toString(),
      fed_at: format(new Date(feeding.fed_at), "yyyy-MM-dd'T'HH:mm"),
      notes: feeding.notes || ''
    });
    loadLastFeeding(feeding.pet_id, feeding.food_id);
    setShowForm(true);
  };

  const handleDelete = async (feedingId: string) => {
    if (!confirm(t('feeding.deleteConfirm'))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('feeding_entries')
        .delete()
        .eq('id', feedingId);
      
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting feeding:', error);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('feeding.title')}</h1>
          <p className="text-gray-600">{t('feeding.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center"
          disabled={pets.length === 0 || foods.length === 0}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('feeding.addFeeding')}
        </button>
      </div>

      {pets.length === 0 || foods.length === 0 ? (
        <div className="text-center py-12">
          <PlusCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('feeding.setupRequired')}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('feeding.setupDescription')}
          </p>
        </div>
      ) : null}

      {/* Feeding Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingFeeding ? t('feeding.editFeeding') : t('feeding.addNewFeeding')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">{t('feeding.pet')} *</label>
                <select
                  value={formData.pet_id}
                  onChange={(e) => {
                    const newPetId = e.target.value;
                    setFormData({ ...formData, pet_id: newPetId });
                    if (newPetId && formData.food_id) {
                      loadLastFeeding(newPetId, formData.food_id);
                    }
                  }}
                  className="input"
                  required
                >
                  <option value="">{t('feeding.selectPet')}</option>
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">{t('feeding.food')} *</label>
                <select
                  value={formData.food_id}
                  onChange={(e) => {
                    const newFoodId = e.target.value;
                    setFormData({ ...formData, food_id: newFoodId });
                    if (formData.pet_id && newFoodId) {
                      loadLastFeeding(formData.pet_id, newFoodId);
                    }
                  }}
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

              {lastFeeding && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    {t('feeding.lastFeedingInfo')}
                  </p>
                  <p className="text-sm text-blue-700">
                    {t('feeding.lastBowlWeight')}: {formatNumber(lastFeeding.amount_put_out)}{t('common.grams')}
                  </p>
                  <p className="text-sm text-blue-600">
                    {formatDateTime(lastFeeding.fed_at)}
                  </p>
                </div>
              )}

              <div>
                <label className="label">{t('feeding.currentBowlWeight')} *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.current_bowl_weight}
                  onChange={(e) => setFormData({ ...formData, current_bowl_weight: e.target.value })}
                  className="input"
                  required
                />
              </div>

              {lastFeeding && formData.current_bowl_weight && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-900 mb-1">
                    {t('feeding.calculatedConsumption')}
                  </p>
                  <p className="text-sm text-green-700">
                    {formatNumber(calculateActualConsumed(parseNumber(formData.current_bowl_weight), lastFeeding.amount_put_out))}{t('common.grams')}
                  </p>
                </div>
              )}

              <div>
                <label className="label">{t('feeding.fedAt')}</label>
                <input
                  type="datetime-local"
                  value={formData.fed_at}
                  onChange={(e) => setFormData({ ...formData, fed_at: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">{t('feeding.notes')}</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingFeeding ? t('feeding.update') : t('feeding.add')} {t('feeding.title')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingFeeding(null);
                    setLastFeeding(null);
                    setFormData({
                      pet_id: '',
                      food_id: '',
                      current_bowl_weight: '',
                      fed_at: '',
                      notes: ''
                    });
                  }}
                  className="btn-secondary flex-1"
                >
                  {t('feeding.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feeding Records */}
      {feedings.length === 0 ? (
        <div className="text-center py-12">
          <PlusCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('feeding.noFeedings')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('feeding.noFeedingsDescription')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedings.map((feeding) => (
            <div key={feeding.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{feeding.pet?.name}</h3>
                    <span className="text-sm text-gray-500">
                      {formatDateTime(feeding.fed_at)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{feeding.food?.name}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">{t('feeding.bowlWeight')}:</span>
                      <p className="text-gray-900">{formatNumber(feeding.amount_put_out)}{t('common.grams')}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">{t('feeding.consumed')}:</span>
                      <p className="text-green-600 font-semibold">{formatNumber(feeding.actual_consumed || 0)}{t('common.grams')}</p>
                    </div>
                  </div>

                  {feeding.calories_consumed && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-700">{t('feeding.calories')}: </span>
                      <span className="text-sm text-orange-600 font-semibold">
                        {formatNumber(feeding.calories_consumed, 0)} {t('common.cal')}
                      </span>
                    </div>
                  )}

                  {feeding.notes && (
                    <p className="mt-2 text-sm text-gray-600 italic">{feeding.notes}</p>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(feeding)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(feeding.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}