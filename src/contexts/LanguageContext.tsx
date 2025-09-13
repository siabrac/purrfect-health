import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  formatNumber: (value: number, decimals?: number) => string;
  formatDateTime: (date: string | Date) => string;
  formatDate: (date: string | Date) => string;
  parseNumber: (value: string) => number;
}

const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.pets': 'Pets',
    'nav.foods': 'Foods',
    'nav.feeding': 'Feeding',
    'nav.analytics': 'Analytics',
    'nav.signOut': 'Sign Out',

    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.add': 'Add',
    'common.update': 'Update',
    'common.loading': 'Loading...',
    'common.grams': 'g',
    'common.kg': 'kg',
    'common.cal': 'cal',
    'common.kcal': 'kcal',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Overview of your pets and recent activity',
    'dashboard.recentFeedings': 'Recent Feedings',
    'dashboard.recentWeights': 'Recent Weights',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.addWeight': 'Add Weight',
    'dashboard.addFeeding': 'Add Feeding',
    'dashboard.noRecentActivity': 'No recent activity',
    'dashboard.noRecentActivityDescription': 'Start by adding your pets and foods, then record feedings and weights.',
    'dashboard.addWeightFor': 'Add Weight for {petName}',
    'dashboard.weight': 'Weight',
    'dashboard.weighedAt': 'Weighed At',
    'dashboard.weightKg': 'Weight (kg)',
    'dashboard.optionalNotes': 'Optional notes...',

    // Auth
    'auth.title': 'Pet Food & Weight Tracker',
    'auth.subtitle': 'Track your pets\' nutrition and health',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.dontHaveAccount': "Don't have an account?",
    'auth.signingIn': 'Signing in...',
    'auth.signingUp': 'Signing up...',
    'auth.continueWithGoogle': 'Continue with Google',
    'auth.terms': 'By signing up, you agree to our Terms of Service and Privacy Policy.',

    // Pets
    'pets.title': 'Pets',
    'pets.subtitle': 'Manage your pets and their information',
    'pets.addPet': 'Add Pet',
    'pets.editPet': 'Edit Pet',
    'pets.addNewPet': 'Add New Pet',
    'pets.name': 'Name',
    'pets.species': 'Species',
    'pets.breed': 'Breed',
    'pets.birthDate': 'Birth Date',
    'pets.targetWeight': 'Target Weight',
    'pets.target': 'Target',
    'pets.age': 'Age',
    'pets.cancel': 'Cancel',
    'pets.update': 'Update',
    'pets.add': 'Add',
    'pets.noPets': 'No pets yet',
    'pets.noPetsDescription': 'Add your first pet to get started with tracking their feeding and weight.',

    // Species
    'species.dog': 'Dog',
    'species.cat': 'Cat',
    'species.bird': 'Bird',
    'species.rabbit': 'Rabbit',
    'species.other': 'Other',

    // Foods
    'foods.title': 'Foods',
    'foods.subtitle': 'Manage your pet foods and their nutritional information',
    'foods.addFood': 'Add Food',
    'foods.editFood': 'Edit Food',
    'foods.addNewFood': 'Add New Food',
    'foods.foodName': 'Food Name',
    'foods.brand': 'Brand',
    'foods.caloriesPerGram': 'Calories per Gram',
    'foods.proteinPerGram': 'Protein per Gram',
    'foods.fatPerGram': 'Fat per Gram',
    'foods.carbsPerGram': 'Carbs per Gram',
    'foods.calories': 'Calories',
    'foods.protein': 'Protein',
    'foods.fat': 'Fat',
    'foods.carbs': 'Carbs',
    'foods.cancel': 'Cancel',
    'foods.update': 'Update',
    'foods.add': 'Add',
    'foods.noFoods': 'No foods yet',
    'foods.noFoodsDescription': 'Add your pet foods to track nutritional information and feeding amounts.',
    'foods.deleteConfirm': 'Are you sure you want to delete this food? This will also delete all associated feeding records.',

    // Feeding
    'feeding.title': 'Feeding',
    'feeding.subtitle': 'Track your pets\' feeding schedule and consumption',
    'feeding.addFeeding': 'Add Feeding',
    'feeding.editFeeding': 'Edit Feeding',
    'feeding.addNewFeeding': 'Add New Feeding',
    'feeding.pet': 'Pet',
    'feeding.food': 'Food',
    'feeding.currentBowlWeight': 'Current Bowl Weight',
    'feeding.fedAt': 'Fed At',
    'feeding.notes': 'Notes',
    'feeding.selectPet': 'Select a pet',
    'feeding.selectFood': 'Select a food',
    'feeding.setupRequired': 'Setup Required',
    'feeding.setupDescription': 'You need to add at least one pet and one food before you can record feedings.',
    'feeding.noFeedings': 'No feeding records yet',
    'feeding.noFeedingsDescription': 'Start tracking your pets\' meals by adding feeding records.',
    'feeding.deleteConfirm': 'Are you sure you want to delete this feeding record?',
    'feeding.bowlWeight': 'Bowl Weight',
    'feeding.consumed': 'Consumed',
    'feeding.calories': 'Calories',
    'feeding.cancel': 'Cancel',
    'feeding.update': 'Update',
    'feeding.add': 'Add',
    'feeding.lastFeedingInfo': 'Last Feeding Information',
    'feeding.lastBowlWeight': 'Previous Bowl Weight',
    'feeding.calculatedConsumption': 'Calculated Consumption',

    // Analytics
    'analytics.title': 'Analytics',
    'analytics.subtitle': 'Analyze your pets\' feeding patterns and weight trends',
    'analytics.pet': 'Pet',
    'analytics.allPets': 'All Pets',
    'analytics.timeRange': 'Time Range',
    'analytics.lastWeek': 'Last Week',
    'analytics.lastMonth': 'Last Month',
    'analytics.last3Months': 'Last 3 Months',
    'analytics.weightTrend': 'Weight Trend',
    'analytics.dailyCalories': 'Daily Calories',
    'analytics.foodDistribution': 'Food Distribution',
    'analytics.noPetsFound': 'No pets found',
    'analytics.noPetsDescription': 'Add pets to view analytics.',
    'analytics.noWeightData': 'No weight data available',
    'analytics.noCalorieData': 'No calorie data available',
    'analytics.noFeedingData': 'No feeding data available',
    'analytics.date': 'Date',
    'analytics.weight': 'Weight',
    'analytics.amount': 'Amount',
    'analytics.weightTrends': 'Weight Trends',

    // Dashboard specific
    'dashboard.totalPets': 'Total Pets',
    'dashboard.todayFeedings': 'Today\'s Feedings',
    'dashboard.todayCalories': 'Today\'s Calories',
    'dashboard.weightTrend': 'Weight Trend',
    'dashboard.trend.up': 'Up',
    'dashboard.trend.down': 'Down',
    'dashboard.trend.stable': 'Stable',
    'dashboard.trend.no-data': 'No Data',
    'dashboard.noRecentFeedings': 'No recent feedings',
    'dashboard.noRecentWeights': 'No recent weights',
    'dashboard.managePets': 'Manage Pets',
    'dashboard.manageFoods': 'Manage Foods',
    'dashboard.viewAnalytics': 'View Analytics',
  },
  de: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.pets': 'Haustiere',
    'nav.foods': 'Futter',
    'nav.feeding': 'Fütterung',
    'nav.analytics': 'Analysen',
    'nav.signOut': 'Abmelden',

    // Common
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.edit': 'Bearbeiten',
    'common.delete': 'Löschen',
    'common.add': 'Hinzufügen',
    'common.update': 'Aktualisieren',
    'common.loading': 'Lädt...',
    'common.grams': 'g',
    'common.kg': 'kg',
    'common.cal': 'cal',
    'common.kcal': 'kcal',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Übersicht über Ihre Haustiere und aktuelle Aktivitäten',
    'dashboard.recentFeedings': 'Letzte Fütterungen',
    'dashboard.recentWeights': 'Letzte Gewichtsmessungen',
    'dashboard.quickActions': 'Schnellaktionen',
    'dashboard.addWeight': 'Gewicht hinzufügen',
    'dashboard.addFeeding': 'Fütterung hinzufügen',
    'dashboard.noRecentActivity': 'Keine aktuellen Aktivitäten',
    'dashboard.noRecentActivityDescription': 'Beginnen Sie, indem Sie Ihre Haustiere und Futter hinzufügen, dann Fütterungen und Gewichte erfassen.',
    'dashboard.addWeightFor': 'Gewicht hinzufügen für {petName}',
    'dashboard.weight': 'Gewicht',
    'dashboard.weighedAt': 'Gewogen am',
    'dashboard.weightKg': 'Gewicht (kg)',
    'dashboard.optionalNotes': 'Optionale Notizen...',

    // Auth
    'auth.title': 'Haustier Futter & Gewicht Tracker',
    'auth.subtitle': 'Verfolgen Sie die Ernährung und Gesundheit Ihrer Haustiere',
    'auth.signIn': 'Anmelden',
    'auth.signUp': 'Registrieren',
    'auth.email': 'E-Mail',
    'auth.password': 'Passwort',
    'auth.confirmPassword': 'Passwort bestätigen',
    'auth.alreadyHaveAccount': 'Haben Sie bereits ein Konto?',
    'auth.dontHaveAccount': 'Haben Sie noch kein Konto?',
    'auth.signingIn': 'Anmeldung läuft...',
    'auth.signingUp': 'Registrierung läuft...',
    'auth.continueWithGoogle': 'Mit Google fortfahren',
    'auth.terms': 'Mit der Registrierung stimmen Sie unseren Nutzungsbedingungen und Datenschutzrichtlinien zu.',

    // Pets
    'pets.title': 'Haustiere',
    'pets.subtitle': 'Verwalten Sie Ihre Haustiere und deren Informationen',
    'pets.addPet': 'Haustier hinzufügen',
    'pets.editPet': 'Haustier bearbeiten',
    'pets.addNewPet': 'Neues Haustier hinzufügen',
    'pets.name': 'Name',
    'pets.species': 'Art',
    'pets.breed': 'Rasse',
    'pets.birthDate': 'Geburtsdatum',
    'pets.targetWeight': 'Zielgewicht',
    'pets.target': 'Ziel',
    'pets.age': 'Alter',
    'pets.cancel': 'Abbrechen',
    'pets.update': 'Aktualisieren',
    'pets.add': 'Hinzufügen',
    'pets.noPets': 'Noch keine Haustiere',
    'pets.noPetsDescription': 'Fügen Sie Ihr erstes Haustier hinzu, um mit der Verfolgung von Fütterung und Gewicht zu beginnen.',

    // Species
    'species.dog': 'Hund',
    'species.cat': 'Katze',
    'species.bird': 'Vogel',
    'species.rabbit': 'Kaninchen',
    'species.other': 'Andere',

    // Foods
    'foods.title': 'Futter',
    'foods.subtitle': 'Verwalten Sie Ihr Haustierfutter und deren Nährwertinformationen',
    'foods.addFood': 'Futter hinzufügen',
    'foods.editFood': 'Futter bearbeiten',
    'foods.addNewFood': 'Neues Futter hinzufügen',
    'foods.foodName': 'Futtername',
    'foods.brand': 'Marke',
    'foods.caloriesPerGram': 'Kalorien pro Gramm',
    'foods.proteinPerGram': 'Protein pro Gramm',
    'foods.fatPerGram': 'Fett pro Gramm',
    'foods.carbsPerGram': 'Kohlenhydrate pro Gramm',
    'foods.calories': 'Kalorien',
    'foods.protein': 'Protein',
    'foods.fat': 'Fett',
    'foods.carbs': 'Kohlenhydrate',
    'foods.cancel': 'Abbrechen',
    'foods.update': 'Aktualisieren',
    'foods.add': 'Hinzufügen',
    'foods.noFoods': 'Noch kein Futter',
    'foods.noFoodsDescription': 'Fügen Sie Ihr Haustierfutter hinzu, um Nährwertinformationen und Fütterungsmengen zu verfolgen.',
    'foods.deleteConfirm': 'Sind Sie sicher, dass Sie dieses Futter löschen möchten? Dies löscht auch alle zugehörigen Fütterungsdaten.',

    // Feeding
    'feeding.title': 'Fütterung',
    'feeding.subtitle': 'Verfolgen Sie den Fütterungsplan und Verbrauch Ihrer Haustiere',
    'feeding.addFeeding': 'Fütterung hinzufügen',
    'feeding.editFeeding': 'Fütterung bearbeiten',
    'feeding.addNewFeeding': 'Neue Fütterung hinzufügen',
    'feeding.pet': 'Haustier',
    'feeding.food': 'Futter',
    'feeding.currentBowlWeight': 'Aktuelles Napfgewicht',
    'feeding.fedAt': 'Gefüttert am',
    'feeding.notes': 'Notizen',
    'feeding.selectPet': 'Haustier auswählen',
    'feeding.selectFood': 'Futter auswählen',
    'feeding.setupRequired': 'Einrichtung erforderlich',
    'feeding.setupDescription': 'Sie müssen mindestens ein Haustier und ein Futter hinzufügen, bevor Sie Fütterungen erfassen können.',
    'feeding.noFeedings': 'Noch keine Fütterungsdaten',
    'feeding.noFeedingsDescription': 'Beginnen Sie mit der Verfolgung der Mahlzeiten Ihrer Haustiere, indem Sie Fütterungsdaten hinzufügen.',
    'feeding.deleteConfirm': 'Sind Sie sicher, dass Sie diesen Fütterungseintrag löschen möchten?',
    'feeding.bowlWeight': 'Napfgewicht',
    'feeding.consumed': 'Verbraucht',
    'feeding.calories': 'Kalorien',
    'feeding.cancel': 'Abbrechen',
    'feeding.update': 'Aktualisieren',
    'feeding.add': 'Hinzufügen',
    'feeding.lastFeedingInfo': 'Letzte Fütterungsinformation',
    'feeding.lastBowlWeight': 'Vorheriges Napfgewicht',
    'feeding.calculatedConsumption': 'Berechneter Verbrauch',

    // Analytics
    'analytics.title': 'Analysen',
    'analytics.subtitle': 'Analysieren Sie die Fütterungsmuster und Gewichtstrends Ihrer Haustiere',
    'analytics.pet': 'Haustier',
    'analytics.allPets': 'Alle Haustiere',
    'analytics.timeRange': 'Zeitraum',
    'analytics.lastWeek': 'Letzte Woche',
    'analytics.lastMonth': 'Letzter Monat',
    'analytics.last3Months': 'Letzte 3 Monate',
    'analytics.weightTrend': 'Gewichtstrend',
    'analytics.dailyCalories': 'Tägliche Kalorien',
    'analytics.foodDistribution': 'Futterverteilung',
    'analytics.noPetsFound': 'Keine Haustiere gefunden',
    'analytics.noPetsDescription': 'Fügen Sie Haustiere hinzu, um Analysen anzuzeigen.',
    'analytics.noWeightData': 'Keine Gewichtsdaten verfügbar',
    'analytics.noCalorieData': 'Keine Kaloriendaten verfügbar',
    'analytics.noFeedingData': 'Keine Fütterungsdaten verfügbar',
    'analytics.date': 'Datum',
    'analytics.weight': 'Gewicht',
    'analytics.amount': 'Menge',
    'analytics.weightTrends': 'Gewichtstrends',

    // Dashboard specific
    'dashboard.totalPets': 'Haustiere Gesamt',
    'dashboard.todayFeedings': 'Heutige Fütterungen',
    'dashboard.todayCalories': 'Heutige Kalorien',
    'dashboard.weightTrend': 'Gewichtstrend',
    'dashboard.trend.up': 'Steigend',
    'dashboard.trend.down': 'Fallend',
    'dashboard.trend.stable': 'Stabil',
    'dashboard.trend.no-data': 'Keine Daten',
    'dashboard.noRecentFeedings': 'Keine aktuellen Fütterungen',
    'dashboard.noRecentWeights': 'Keine aktuellen Gewichtsmessungen',
    'dashboard.managePets': 'Haustiere Verwalten',
    'dashboard.manageFoods': 'Futter Verwalten',
    'dashboard.viewAnalytics': 'Analysen Anzeigen',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  const formatNumber = (value: number, decimals: number = 1): string => {
    if (language === 'de') {
      return value.toFixed(decimals).replace('.', ',');
    }
    return value.toFixed(decimals);
  };

  const formatDateTime = (date: string | Date): string => {
    const d = new Date(date);
    if (language === 'de') {
      return d.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    if (language === 'de') {
      return d.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const parseNumber = (value: string): number => {
    if (language === 'de') {
      // Replace comma with dot for German input
      return parseFloat(value.replace(',', '.'));
    }
    return parseFloat(value);
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      formatNumber,
      formatDateTime,
      formatDate,
      parseNumber
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}