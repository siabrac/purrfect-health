import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { Pet, Food, FeedingEntry } from '../types';
import { Plus, Edit2, Trash2, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function Feeding() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [pets, setPets] = useState<Pet[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [feedings, setFeedings] = useState<FeedingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFeeding, setEditingFeeding] = useState<FeedingEntry | null>(null);
  const [formData, setFormData] = useState({
    pet_id: '',
    food_id: '',
    amount_put_out: '',
    amount_not_eaten: '',
    amount_refilled: '',
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

  const calculateActualConsumed = (putOut: number, notEaten: number = 0, refilled: number = 0) => {
    return putOut + refilled - notEaten;
  };

  const calculateCalories = (actualConsumed: number, food: Food) => {
    if (!food.calories_per_gram) return null;
    return actualConsumed * food.calories_per_gram;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const putOut = parseFloat(formData.amount_put_out);
      const notEaten = formData.amount_not_eaten ? parseFloat(formData.amount_not_eaten) : 0;
      const refilled = formData.amount_refilled ? parseFloat(formData.amount_refilled) : 0;
      const actualConsumed = calculateActualConsumed(putOut, notEaten, refilled);
      
      const selectedFood = foods.find(f => f.id === formData.food_id);
      const caloriesConsumed = selectedFood ? calculateCalories(actualConsumed, selectedFood) : null;

      const feedingData = {
        pet_id: formData.pet_id,
        food_id: formData.food_id,
        amount_put_out: putOut,
        amount_not_eaten: notEaten || null,
        amount_refilled: refilled || null,
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
      setFormData({
        pet_id: '',
        food_id: '',
        amount_put_out: '',
        amount_not_eaten: '',
        amount_refilled: '',
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
      amount_put_out: feeding.amount_put_out.toString(),
      amount_not_eaten: feeding.amount_not_eaten?.toString() || '',
      amount_refilled: feeding.amount_refilled?.toString() || '',
      fed_at: format(new Date(feeding.fed_at), "yyyy-MM-dd'T'HH:mm"),
      notes: feeding.notes || ''
    });
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
                  onChange={(e) => setFormData({ ...formData, pet_id: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, food_id: e.target.value })}
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
                  value={formData.amount_put_out}
                  onChange={(e) => setFormData({ ...formData, amount_put_out: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">{t('feeding.amountNotEaten')}</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.amount_not_eaten}
                  onChange={(e) => setFormData({ ...formData, amount_not_eaten: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">{t('feeding.amountRefilled')}</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.amount_refilled}
                  onChange={(e) => setFormData({ ...formData, amount_refilled: e.target.value })}
                  className="input"
                />
              </div>

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
                    setFormData({
                      pet_id: '',
                      food_id: '',
                      amount_put_out: '',
                      amount_not_eaten: '',
                      amount_refilled: '',
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
                      {format(new Date(feeding.fed_at), 'MMM dd, yyyy h:mm a')}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{feeding.food?.name}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">{t('feeding.putOut')}:</span>
                      <p className="text-gray-900">{feeding.amount_put_out}{t('common.grams')}</p>
                    </div>
                    {feeding.amount_not_eaten && (
                      <div>
                        <span className="font-medium text-gray-700">{t('feeding.notEaten')}:</span>
                        <p className="text-gray-900">{feeding.amount_not_eaten}{t('common.grams')}</p>
                      </div>
                    )}
                    {feeding.amount_refilled && (
                      <div>
                        <span className="font-medium text-gray-700">{t('feeding.refilled')}:</span>
                        <p className="text-gray-900">{feeding.amount_refilled}{t('common.grams')}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">{t('feeding.consumed')}:</span>
                      <p className="text-green-600 font-semibold">{feeding.actual_consumed}{t('common.grams')}</p>
                    </div>
                  </div>

                  {feeding.calories_consumed && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-700">{t('feeding.calories')}: </span>
                      <span className="text-sm text-orange-600 font-semibold">
                        {Math.round(feeding.calories_consumed)} {t('common.cal')}
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