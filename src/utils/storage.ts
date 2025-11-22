import { Student, Payment } from '../App';

// Debounced save helper
let saveTimeout: NodeJS.Timeout | null = null;

export const storage = {
  // Load data from localStorage
  load: (): { students: Student[], payments: Payment[] } => {
    if (typeof window === 'undefined') {
      return { students: [], payments: [] };
    }
    
    try {
      const studentsData = localStorage.getItem('students');
      const paymentsData = localStorage.getItem('payments');
      
      return {
        students: studentsData ? JSON.parse(studentsData) : [],
        payments: paymentsData ? JSON.parse(paymentsData) : [],
      };
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      return { students: [], payments: [] };
    }
  },

  // Save data to localStorage with debouncing
  save: (students: Student[], payments: Payment[], immediate: boolean = false) => {
    if (typeof window === 'undefined') return;

    const doSave = () => {
      try {
        localStorage.setItem('students', JSON.stringify(students));
        localStorage.setItem('payments', JSON.stringify(payments));
        console.log('✅ Data saved:', { students: students.length, payments: payments.length });
      } catch (error) {
        console.error('❌ Error saving data to localStorage:', error);
        // If quota exceeded, try to clear old data
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn('Storage quota exceeded. Attempting to save only essential data...');
          try {
            localStorage.setItem('students', JSON.stringify(students));
            localStorage.setItem('payments', JSON.stringify(payments.slice(-100))); // Keep last 100 payments
          } catch (retryError) {
            console.error('Failed to save even after cleanup:', retryError);
          }
        }
      }
    };

    if (immediate) {
      // Clear any pending saves
      if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
      }
      doSave();
    } else {
      // Debounce: wait 300ms before saving
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      saveTimeout = setTimeout(doSave, 300);
    }
  },

  // Clear all data
  clear: () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('students');
      localStorage.removeItem('payments');
      console.log('🗑️ Storage cleared');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },

  // Export data as JSON
  export: (): string => {
    const data = storage.load();
    return JSON.stringify(data, null, 2);
  },

  // Import data from JSON
  import: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.students && data.payments) {
        storage.save(data.students, data.payments, true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  },
};
