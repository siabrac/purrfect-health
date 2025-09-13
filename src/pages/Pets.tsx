import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { Pet, WeightEntry } from '../types';
import { Plus, Edit2, Trash2, Heart, Scale } from 'lucide-react';
import { format, differenceInYears, differenceInMonths } from 'date-fns';

export default function Pets() {
  const { user } = useAuth();
  const { t, formatNumber, formatDateTime } = useLanguage();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [selectedPetForWeight, setSelectedPetForWeight] = useState<Pet | null>(null);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog' as Pet['species'],
    breed: '',
    birth_date: '',
    target_weight: ''
  });
  const [weightFormData, setWeightFormData] = useState({
    weight: '',
    notes: '',
    weighed_at: ''
  });

  useEffect(() => {
    if (user) {
      loadPets();
    }
  }, [user]);

  useEffect(() => { loadWeightEntries(); }, [pets]);

  const loadPets = async () => {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPets(data || []);
    } catch (error) {
      console.error('Error loading pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWeightEntries = async () => {
    if (pets.length === 0) return;
    
    try {
      const { data } = await supabase
        .from('weight_entries')
        .select('*, pet:pets(*)')
        .eq('user_id', user!.id)
        .order('weighed_at', { ascending: false });
      
      setWeightEntries(data || []);
    } catch (error) {
      console.error('Error loading weight entries:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const petData = {
        name: formData.name,
        species: formData.species,
        breed: formData.breed || null,
        birth_date: formData.birth_date || null,
        target_weight: formData.target_weight ? parseFloat(formData.target_weight) : null,
        user_id: user!.id
      };

      if (editingPet) {
        const { error } = await supabase
          .from('pets')
          .update(petData)
          .eq('id', editingPet.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pets')
          .insert([petData]);
        if (error) throw error;
      }

      setShowForm(false);
      setEditingPet(null);
      setFormData({ name: '', species: 'dog', breed: '', birth_date: '', target_weight: '' });
      loadPets();
    } catch (error) {
      console.error('Error saving pet:', error);
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
    
    if (!selectedPetForWeight) return;
    
    try {
      const weightData = {
        pet_id: selectedPetForWeight.id,
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
      setSelectedPetForWeight(null);
      setWeightFormData({ weight: '', notes: '', weighed_at: '' });
      loadWeightEntries();
    } catch (error) {
      console.error('Error saving weight entry:', error);
    }
  };

  const handleAddWeight = (pet: Pet) => {
    setSelectedPetForWeight(pet);
    setWeightFormData({ 
      weight: '', 
      notes: '', 
      weighed_at: getCurrentDateTime() 
    });
    setShowWeightForm(true);
  };

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '',
      birth_date: pet.birth_date || '',
      target_weight: pet.target_weight?.toString() || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (petId: string) => {
    if (!confirm('Are you sure you want to delete this pet? This will also delete all associated feeding and weight records.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', petId);
      
      if (error) throw error;
      loadPets();
    } catch (error) {
      console.error('Error deleting pet:', error);
    }
  };

  const getLatestWeight = (petId: string) => {
    return weightEntries.find(entry => entry.pet_id === petId);
  };

  const getAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const years = differenceInYears(new Date(), birth);
    const months = differenceInMonths(new Date(), birth) % 12;
    
    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
    return `${years} year${years !== 1 ? 's' : ''} ${months > 0 ? `${months} month${months !== 1 ? 's' : ''}` : ''}`;
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
          <h1 className="text-2xl font-bold text-gray-900">{t('pets.title')}</h1>
          <p className="text-gray-600">{t('pets.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('pets.addPet')}
        </button>
      </div>

      {/* Pet Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingPet ? t('pets.editPet') : t('pets.addNewPet')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">{t('pets.name')} *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">{t('pets.species')} *</label>
                <select
                  value={formData.species}
                  onChange={(e) => setFormData({ ...formData, species: e.target.value as Pet['species'] })}
                  className="input"
                  required
                >
                  <option value="dog">{t('species.dog')}</option>
                  <option value="cat">{t('species.cat')}</option>
                  <option value="bird">{t('species.bird')}</option>
                  <option value="rabbit">{t('species.rabbit')}</option>
                  <option value="other">{t('species.other')}</option>
                </select>
              </div>

              <div>
                <label className="label">{t('pets.breed')}</label>
                <input
                  type="text"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">{t('pets.birthDate')}</label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">{t('pets.targetWeight')}</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.target_weight}
                  onChange={(e) => setFormData({ ...formData, target_weight: e.target.value })}
                  className="input"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingPet ? t('pets.update') : t('pets.add')} Pet
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPet(null);
                    setFormData({ name: '', species: 'dog', breed: '', birth_date: '', target_weight: '' });
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

      {/* Weight Entry Form Modal */}
      {showWeightForm && selectedPetForWeight && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('dashboard.addWeightFor')} {selectedPetForWeight.name}
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
                    setSelectedPetForWeight(null);
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

      {/* Pets Grid */}
      {pets.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('pets.noPets')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('pets.noPetsDescription')}</p>
          <div className="mt-6">
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              {t('pets.addPet')}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => {
            const latestWeight = getLatestWeight(pet.id);
            
            return (
              <div key={pet.id} className="card">
                <div className="flex items-start justify-between">
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
                  <div className="flex flex-col space-y-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAddWeight(pet)}
                        className="text-gray-400 hover:text-blue-600"
                        title="Add Weight"
                      >
                        <Scale className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(pet)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pet.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}