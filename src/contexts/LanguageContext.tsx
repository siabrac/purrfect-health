import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
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
    
    // Auth
    'auth.title': 'Pet Tracker',
    'auth.subtitle': 'Sign in to your account',
    'auth.continueWithGoogle': 'Continue with Google',
    'auth.mockLogin': 'Mock Login (Dev Only)',
    'auth.signingIn': 'Signing in...',
    'auth.loggingIn': 'Logging in...',
    'auth.terms': 'By signing in, you agree to our terms of service and privacy policy.',
    'auth.devInfo1': 'Use "Mock Login" for development in Bolt preview',
    'auth.devInfo2': 'Use "Google" for testing in separate tab',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Overview of your pets\' health and feeding',
    'dashboard.totalPets': 'Total Pets',
    'dashboard.todayFeedings': 'Today\'s Feedings',
    'dashboard.todayCalories': 'Today\'s Calories',
    'dashboard.weightTrend': 'Weight Trend',
    'dashboard.recentFeedings': 'Recent Feedings',
    'dashboard.weightTrends': 'Weight Trends',
    'dashboard.noRecentFeedings': 'No recent feedings',
    'dashboard.noWeightData': 'No weight data available',
    
    // Pets
    'pets.title': 'My Pets',
    'pets.subtitle': 'Manage your pets and their information',
    'pets.addPet': 'Add Pet',
    'pets.editPet': 'Edit Pet',
    'pets.addNewPet': 'Add New Pet',
    'pets.noPets': 'No pets',
    'pets.noPetsDescription': 'Get started by adding your first pet.',
    'pets.name': 'Name',
    'pets.species': 'Species',
    'pets.breed': 'Breed',
    'pets.birthDate': 'Birth Date',
    'pets.targetWeight': 'Target Weight (kg)',
    'pets.age': 'Age',
    'pets.target': 'Target',
    'pets.update': 'Update',
    'pets.add': 'Add',
    'pets.cancel': 'Cancel',
    'pets.deleteConfirm': 'Are you sure you want to delete this pet? This will also delete all associated feeding and weight records.',
    
    // Species
    'species.dog': 'Dog',
    'species.cat': 'Cat',
    'species.bird': 'Bird',
    'species.rabbit': 'Rabbit',
    'species.other': 'Other',
    
    // Foods
    'foods.title': 'Food Database',
    'foods.subtitle': 'Manage your pet foods and their nutritional information',
    'foods.addFood': 'Add Food',
    'foods.editFood': 'Edit Food',
    'foods.addNewFood': 'Add New Food',
    'foods.noFoods': 'No foods',
    'foods.noFoodsDescription': 'Get started by adding your first food.',
    'foods.foodName': 'Food Name',
    'foods.brand': 'Brand',
    'foods.caloriesPerGram': 'Calories per gram',
    'foods.proteinPerGram': 'Protein per gram',
    'foods.fatPerGram': 'Fat per gram',
    'foods.carbsPerGram': 'Carbs per gram',
    'foods.calories': 'Calories',
    'foods.protein': 'Protein',
    'foods.fat': 'Fat',
    'foods.carbs': 'Carbs',
    'foods.update': 'Update',
    'foods.add': 'Add',
    'foods.cancel': 'Cancel',
    'foods.deleteConfirm': 'Are you sure you want to delete this food? This will also delete all associated feeding records.',
    
    // Feeding
    'feeding.title': 'Feeding Records',
    'feeding.subtitle': 'Track your pets\' food intake and calculate consumption',
    'feeding.addFeeding': 'Add Feeding',
    'feeding.editFeeding': 'Edit Feeding',
    'feeding.addNewFeeding': 'Add New Feeding',
    'feeding.noFeedings': 'No feeding records',
    'feeding.noFeedingsDescription': 'Start tracking your pets\' food intake.',
    'feeding.setupRequired': 'Setup Required',
    'feeding.setupDescription': 'You need to add at least one pet and one food before recording feedings.',
    'feeding.pet': 'Pet',
    'feeding.food': 'Food',
    'feeding.amountPutOut': 'Amount Put Out (grams)',
    'feeding.amountNotEaten': 'Amount Not Eaten (grams)',
    'feeding.amountRefilled': 'Amount Refilled (grams)',
    'feeding.fedAt': 'Fed At',
    'feeding.notes': 'Notes',
    'feeding.putOut': 'Put Out',
    'feeding.notEaten': 'Not Eaten',
    'feeding.refilled': 'Refilled',
    'feeding.consumed': 'Consumed',
    'feeding.calories': 'Calories',
    'feeding.update': 'Update',
    'feeding.add': 'Add',
    'feeding.cancel': 'Cancel',
    'feeding.deleteConfirm': 'Are you sure you want to delete this feeding record?',
    'feeding.selectPet': 'Select a pet',
    'feeding.selectFood': 'Select a food',
    
    // Analytics
    'analytics.title': 'Analytics',
    'analytics.subtitle': 'Track your pets\' weight trends and feeding patterns',
    'analytics.pet': 'Pet',
    'analytics.timeRange': 'Time Range',
    'analytics.allPets': 'All Pets',
    'analytics.lastWeek': 'Last Week',
    'analytics.lastMonth': 'Last Month',
    'analytics.last3Months': 'Last 3 Months',
    'analytics.weightTrends': 'Weight Trends',
    'analytics.dailyCalories': 'Daily Calories',
    'analytics.foodDistribution': 'Food Distribution',
    'analytics.noPetsFound': 'No pets found',
    'analytics.noPetsDescription': 'Add some pets to see analytics.',
    'analytics.noWeightData': 'No weight data available',
    'analytics.noCalorieData': 'No calorie data available',
    'analytics.noFeedingData': 'No feeding data available',
    'analytics.weight': 'Weight',
    'analytics.date': 'Date',
    'analytics.amount': 'Amount',
    
    // Common
    'common.loading': 'Loading...',
    'common.required': 'required',
    'common.optional': 'optional',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.grams': 'g',
    'common.kg': 'kg',
    'common.cal': 'cal',
    'common.months': 'months',
    'common.month': 'month',
    'common.years': 'years',
    'common.year': 'year',
  },
  de: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.pets': 'Haustiere',
    'nav.foods': 'Futter',
    'nav.feeding': 'Fütterung',
    'nav.analytics': 'Analysen',
    'nav.signOut': 'Abmelden',
    
    // Auth
    'auth.title': 'Haustier Tracker',
    'auth.subtitle': 'Melden Sie sich in Ihrem Konto an',
    'auth.continueWithGoogle': 'Mit Google fortfahren',
    'auth.mockLogin': 'Mock Login (Nur Entwicklung)',
    'auth.signingIn': 'Anmeldung läuft...',
    'auth.loggingIn': 'Anmeldung läuft...',
    'auth.terms': 'Mit der Anmeldung stimmen Sie unseren Nutzungsbedingungen und Datenschutzrichtlinien zu.',
    'auth.devInfo1': 'Verwenden Sie "Mock Login" für die Entwicklung in der Bolt-Vorschau',
    'auth.devInfo2': 'Verwenden Sie "Google" zum Testen in einem separaten Tab',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Überblick über die Gesundheit und Fütterung Ihrer Haustiere',
    'dashboard.totalPets': 'Haustiere Gesamt',
    'dashboard.todayFeedings': 'Heutige Fütterungen',
    'dashboard.todayCalories': 'Heutige Kalorien',
    'dashboard.weightTrend': 'Gewichtstrend',
    'dashboard.recentFeedings': 'Letzte Fütterungen',
    'dashboard.weightTrends': 'Gewichtstrends',
    'dashboard.noRecentFeedings': 'Keine aktuellen Fütterungen',
    'dashboard.noWeightData': 'Keine Gewichtsdaten verfügbar',
    
    // Pets
    'pets.title': 'Meine Haustiere',
    'pets.subtitle': 'Verwalten Sie Ihre Haustiere und deren Informationen',
    'pets.addPet': 'Haustier hinzufügen',
    'pets.editPet': 'Haustier bearbeiten',
    'pets.addNewPet': 'Neues Haustier hinzufügen',
    'pets.noPets': 'Keine Haustiere',
    'pets.noPetsDescription': 'Beginnen Sie, indem Sie Ihr erstes Haustier hinzufügen.',
    'pets.name': 'Name',
    'pets.species': 'Art',
    'pets.breed': 'Rasse',
    'pets.birthDate': 'Geburtsdatum',
    'pets.targetWeight': 'Zielgewicht (kg)',
    'pets.age': 'Alter',
    'pets.target': 'Ziel',
    'pets.update': 'Aktualisieren',
    'pets.add': 'Hinzufügen',
    'pets.cancel': 'Abbrechen',
    'pets.deleteConfirm': 'Sind Sie sicher, dass Sie dieses Haustier löschen möchten? Dies löscht auch alle zugehörigen Fütterungs- und Gewichtsaufzeichnungen.',
    
    // Species
    'species.dog': 'Hund',
    'species.cat': 'Katze',
    'species.bird': 'Vogel',
    'species.rabbit': 'Kaninchen',
    'species.other': 'Andere',
    
    // Foods
    'foods.title': 'Futter-Datenbank',
    'foods.subtitle': 'Verwalten Sie Ihre Haustierfutter und deren Nährwertinformationen',
    'foods.addFood': 'Futter hinzufügen',
    'foods.editFood': 'Futter bearbeiten',
    'foods.addNewFood': 'Neues Futter hinzufügen',
    'foods.noFoods': 'Kein Futter',
    'foods.noFoodsDescription': 'Beginnen Sie, indem Sie Ihr erstes Futter hinzufügen.',
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
    'foods.update': 'Aktualisieren',
    'foods.add': 'Hinzufügen',
    'foods.cancel': 'Abbrechen',
    'foods.deleteConfirm': 'Sind Sie sicher, dass Sie dieses Futter löschen möchten? Dies löscht auch alle zugehörigen Fütterungsaufzeichnungen.',
    
    // Feeding
    'feeding.title': 'Fütterungsaufzeichnungen',
    'feeding.subtitle': 'Verfolgen Sie die Nahrungsaufnahme Ihrer Haustiere und berechnen Sie den Verbrauch',
    'feeding.addFeeding': 'Fütterung hinzufügen',
    'feeding.editFeeding': 'Fütterung bearbeiten',
    'feeding.addNewFeeding': 'Neue Fütterung hinzufügen',
    'feeding.noFeedings': 'Keine Fütterungsaufzeichnungen',
    'feeding.noFeedingsDescription': 'Beginnen Sie mit der Verfolgung der Nahrungsaufnahme Ihrer Haustiere.',
    'feeding.setupRequired': 'Einrichtung erforderlich',
    'feeding.setupDescription': 'Sie müssen mindestens ein Haustier und ein Futter hinzufügen, bevor Sie Fütterungen aufzeichnen können.',
    'feeding.pet': 'Haustier',
    'feeding.food': 'Futter',
    'feeding.amountPutOut': 'Ausgegebene Menge (Gramm)',
    'feeding.amountNotEaten': 'Nicht gegessene Menge (Gramm)',
    'feeding.amountRefilled': 'Nachgefüllte Menge (Gramm)',
    'feeding.fedAt': 'Gefüttert um',
    'feeding.notes': 'Notizen',
    'feeding.putOut': 'Ausgegeben',
    'feeding.notEaten': 'Nicht gegessen',
    'feeding.refilled': 'Nachgefüllt',
    'feeding.consumed': 'Verbraucht',
    'feeding.calories': 'Kalorien',
    'feeding.update': 'Aktualisieren',
    'feeding.add': 'Hinzufügen',
    'feeding.cancel': 'Abbrechen',
    'feeding.deleteConfirm': 'Sind Sie sicher, dass Sie diese Fütterungsaufzeichnung löschen möchten?',
    'feeding.selectPet': 'Haustier auswählen',
    'feeding.selectFood': 'Futter auswählen',
    
    // Analytics
    'analytics.title': 'Analysen',
    'analytics.subtitle': 'Verfolgen Sie die Gewichtstrends und Fütterungsmuster Ihrer Haustiere',
    'analytics.pet': 'Haustier',
    'analytics.timeRange': 'Zeitraum',
    'analytics.allPets': 'Alle Haustiere',
    'analytics.lastWeek': 'Letzte Woche',
    'analytics.lastMonth': 'Letzter Monat',
    'analytics.last3Months': 'Letzte 3 Monate',
    'analytics.weightTrends': 'Gewichtstrends',
    'analytics.dailyCalories': 'Tägliche Kalorien',
    'analytics.foodDistribution': 'Futterverteilung',
    'analytics.noPetsFound': 'Keine Haustiere gefunden',
    'analytics.noPetsDescription': 'Fügen Sie einige Haustiere hinzu, um Analysen zu sehen.',
    'analytics.noWeightData': 'Keine Gewichtsdaten verfügbar',
    'analytics.noCalorieData': 'Keine Kaloriendaten verfügbar',
    'analytics.noFeedingData': 'Keine Fütterungsdaten verfügbar',
    'analytics.weight': 'Gewicht',
    'analytics.date': 'Datum',
    'analytics.amount': 'Menge',
    
    // Common
    'common.loading': 'Lädt...',
    'common.required': 'erforderlich',
    'common.optional': 'optional',
    'common.save': 'Speichern',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.close': 'Schließen',
    'common.confirm': 'Bestätigen',
    'common.grams': 'g',
    'common.kg': 'kg',
    'common.cal': 'kal',
    'common.months': 'Monate',
    'common.month': 'Monat',
    'common.years': 'Jahre',
    'common.year': 'Jahr',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('pet-tracker-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('pet-tracker-language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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