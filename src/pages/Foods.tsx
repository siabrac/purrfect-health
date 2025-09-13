import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Food } from '../types';
import { Plus, Edit2, Trash2, Utensils } from 'lucide-react';

export default function Foods() {
  const { user } = useAuth();
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    calories_per_gram: '',
    protein_per_gram: '',
    fat_per_gram: '',
    carbs_per_gram: ''
  });

  useEffect(() => {
    if (user) {
      loadFoods();
    }
  }, [user]);

  const loadFoods = async () => {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFoods(data || []);
    } catch (error) {
      console.error('Error loading foods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const foodData = {
        name: formData.name,
        brand: formData.brand || null,
        calories_per_gram: formData.calories_per_gram ? parseFloat(formData.calories_per_gram) : null,
        protein_per_gram: formData.protein_per_gram ? parseFloat(formData.protein_per_gram) : null,
        fat_per_gram: formData.fat_per_gram ? parseFloat(formData.fat_per_gram) : null,
        carbs_per_gram: formData.carbs_per_gram ? parseFloat(formData.carbs_per_gram) : null,
        user_id: user!.id
      };

      if (editingFood) {
        const { error } = await supabase
          .from('foods')
          .update(foodData)
          .eq('id', editingFood.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('foods')
          .insert([foodData]);
        if (error) throw error;
      }

      setShowForm(false);
      setEditingFood(null);
      setFormData({
        name: '',
        brand: '',
        calories_per_gram: '',
        protein_per_gram: '',
        fat_per_gram: '',
        carbs_per_gram: ''
      });
      loadFoods();
    } catch (error) {
      console.error('Error saving food:', error);
    }
  };

  const handleEdit = (food: Food) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      brand: food.brand || '',
      calories_per_gram: food.calories_per_gram?.toString() || '',
      protein_per_gram: food.protein_per_gram?.toString() || '',
      fat_per_gram: food.fat_per_gram?.toString() || '',
      carbs_per_gram: food.carbs_per_gram?.toString() || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (foodId: string) => {
    if (!confirm('Are you sure you want to delete this food? This will also delete all associated feeding records.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('foods')
        .delete()
        .eq('id', foodId);
      
      if (error) throw error;
      loadFoods();
    } catch (error) {
      console.error('Error deleting food:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">Food Database</h1>
          <p className="text-gray-600">Manage your pet foods and their nutritional information</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Food
        </button>
      </div>

      {/* Food Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingFood ? 'Edit Food' : 'Add New Food'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Food Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Calories per gram</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.calories_per_gram}
                    onChange={(e) => setFormData({ ...formData, calories_per_gram: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Protein per gram</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.protein_per_gram}
                    onChange={(e) => setFormData({ ...formData, protein_per_gram: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Fat per gram</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.fat_per_gram}
                    onChange={(e) => setFormData({ ...formData, fat_per_gram: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Carbs per gram</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.carbs_per_gram}
                    onChange={(e) => setFormData({ ...formData, carbs_per_gram: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingFood ? 'Update' : 'Add'} Food
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingFood(null);
                    setFormData({
                      name: '',
                      brand: '',
                      calories_per_gram: '',
                      protein_per_gram: '',
                      fat_per_gram: '',
                      carbs_per_gram: ''
                    });
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Foods Grid */}
      {foods.length === 0 ? (
        <div className="text-center py-12">
          <Utensils className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No foods</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first food.</p>
          <div className="mt-6">
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Food
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {foods.map((food) => (
            <div key={food.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{food.name}</h3>
                  {food.brand && (
                    <p className="text-sm text-gray-600">{food.brand}</p>
                  )}
                  
                  {food.calories_per_gram && (
                    <div className="mt-3 space-y-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Calories:</span> {food.calories_per_gram}/g
                      </p>
                      {food.protein_per_gram && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Protein:</span> {food.protein_per_gram}g/g
                        </p>
                      )}
                      {food.fat_per_gram && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Fat:</span> {food.fat_per_gram}g/g
                        </p>
                      )}
                      {food.carbs_per_gram && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Carbs:</span> {food.carbs_per_gram}g/g
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(food)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(food.id)}
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