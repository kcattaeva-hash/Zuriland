import { useState, useCallback } from 'react';
import { StudentPayments } from './components/StudentPayments';
import { AddStudentDialog } from './components/AddStudentDialog';
import { Button } from './components/ui/button';
import { UserPlus, Sparkles } from 'lucide-react';
import { findNextPaymentDate, convertToISOString } from './utils/dateUtils';

export interface Student {
  id: string;
  name: string;
  phone?: string;
  productName: string;
  debtAmount: number;
  paidAmount: number;
  paymentDate: string;
  nextPaymentDate?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  note: string;
}

// Storage helpers - pure functions
const loadData = () => {
  if (typeof window === 'undefined') return { students: [], payments: [] };
  try {
    return {
      students: JSON.parse(localStorage.getItem('students') || '[]'),
      payments: JSON.parse(localStorage.getItem('payments') || '[]'),
    };
  } catch {
    return { students: [], payments: [] };
  }
};

const saveData = (students: Student[], payments: Payment[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('payments', JSON.stringify(payments));
  } catch (e) {
    console.error('Save error:', e);
  }
};

export default function App() {
  // Single source of truth - one state object
  const [state, setState] = useState(() => ({
    ...loadData(),
    isAddDialogOpen: false,
  }));

  // Helper to update state and save
  const updateState = useCallback((updates: Partial<typeof state>) => {
    setState(prev => {
      const next = { ...prev, ...updates };
      // Save to localStorage async
      if ('students' in updates || 'payments' in updates) {
        queueMicrotask(() => saveData(next.students, next.payments));
      }
      return next;
    });
  }, []);

  const addStudent = useCallback((student: Omit<Student, 'id' | 'paidAmount' | 'paymentDate'>, paymentDates: string[] = []) => {
    const newStudentId = Date.now().toString();
    const nextPaymentDate = findNextPaymentDate(paymentDates);
    
    const newStudent: Student = {
      ...student,
      id: newStudentId,
      paidAmount: 0,
      paymentDate: new Date().toISOString(),
      nextPaymentDate,
    };
    
    const newPayments: Payment[] = paymentDates.map((dateStr, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      studentId: newStudentId,
      amount: 0,
      date: convertToISOString(dateStr),
      note: 'Запланированный платеж',
    }));
    
    updateState({
      students: [...state.students, newStudent],
      payments: [...state.payments, ...newPayments],
    });
  }, [state.students, state.payments, updateState]);

  const addPayment = useCallback((studentId: string, amount: number, note: string, paymentDate?: string) => {
    const newPayment: Payment = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      studentId,
      amount,
      date: paymentDate ? convertToISOString(paymentDate) : new Date().toISOString(),
      note,
    };
    
    updateState({
      students: state.students.map(s =>
        s.id === studentId ? { ...s, paidAmount: s.paidAmount + amount } : s
      ),
      payments: [...state.payments, newPayment],
    });
  }, [state.students, state.payments, updateState]);

  const updatePayment = useCallback((paymentId: string, studentId: string, oldAmount: number, newAmount: number) => {
    const diff = newAmount - oldAmount;
    
    updateState({
      students: state.students.map(s =>
        s.id === studentId ? { ...s, paidAmount: s.paidAmount + diff } : s
      ),
      payments: state.payments.map(p =>
        p.id === paymentId ? { ...p, amount: newAmount } : p
      ),
    });
  }, [state.students, state.payments, updateState]);

  const updateStudent = useCallback((id: string, updates: Partial<Student>) => {
    updateState({
      students: state.students.map(s => s.id === id ? { ...s, ...updates } : s),
    });
  }, [state.students, updateState]);

  const deleteStudent = useCallback((id: string) => {
    updateState({
      students: state.students.filter(s => s.id !== id),
      payments: state.payments.filter(p => p.studentId !== id),
    });
  }, [state.students, state.payments, updateState]);

  const deletePayment = useCallback((paymentId: string, studentId: string, amount: number) => {
    updateState({
      students: state.students.map(s =>
        s.id === studentId ? { ...s, paidAmount: s.paidAmount - amount } : s
      ),
      payments: state.payments.filter(p => p.id !== paymentId),
    });
  }, [state.students, state.payments, updateState]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-green-50 p-4 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-stone-300 rounded-full mix-blend-multiply filter blur-xl opacity-30" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-25" />
        <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-30" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="glass rounded-3xl shadow-2xl p-6 md:p-8 border border-stone-300/50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-8 h-8 text-green-700" />
                <h1 className="bg-gradient-to-r from-green-700 via-stone-700 to-amber-800 bg-clip-text text-transparent">
                  Отчетность по оплатам касс
                </h1>
              </div>
              <p className="text-stone-600">
                Отслеживайте платежи и задолженности
              </p>
            </div>
            <Button
              onClick={() => updateState({ isAddDialogOpen: true })}
              className="bg-gradient-to-r from-green-600 via-stone-600 to-amber-700 hover:from-green-700 hover:via-stone-700 hover:to-amber-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Добавить клиента
            </Button>
          </div>

          <StudentPayments
            students={state.students}
            payments={state.payments}
            onAddPayment={addPayment}
            onUpdateStudent={updateStudent}
            onDeleteStudent={deleteStudent}
            onDeletePayment={deletePayment}
            onUpdatePayment={updatePayment}
          />
        </div>
      </div>

      <AddStudentDialog
        open={state.isAddDialogOpen}
        onOpenChange={(open) => updateState({ isAddDialogOpen: open })}
        onAddStudent={addStudent}
      />
    </div>
  );
}
