import { useState, useCallback, useEffect, useRef } from 'react';
import { StudentPayments } from './components/StudentPayments';
import { AddStudentDialog } from './components/AddStudentDialog';
import { AutoSaveIndicator } from './components/AutoSaveIndicator';
import { Button } from './components/ui/button';
import { UserPlus, Sparkles } from 'lucide-react';
import { findNextPaymentDate, convertToISOString } from './utils/dateUtils';
import { storage } from './utils/storage';

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

export default function App() {
  // Load initial data
  const [state, setState] = useState(() => ({
    ...storage.load(),
    isAddDialogOpen: false,
  }));

  // Keep track of previous state for autosave
  const prevStateRef = useRef(state);

  // Auto-save effect - triggers on any data change
  useEffect(() => {
    const prev = prevStateRef.current;
    const current = state;
    
    // Check if students or payments changed
    if (prev.students !== current.students || prev.payments !== current.payments) {
      storage.save(current.students, current.payments);
      prevStateRef.current = current;
    }
  }, [state.students, state.payments]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      storage.save(state.students, state.payments, true);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.students, state.payments]);

  // Optimized state update function
  const updateState = useCallback((updates: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const addStudent = useCallback((student: Omit<Student, 'id' | 'paidAmount' | 'paymentDate'>, paymentDates: string[] = []) => {
    const newStudentId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const nextPaymentDate = findNextPaymentDate(paymentDates);
    
    const newStudent: Student = {
      ...student,
      id: newStudentId,
      paidAmount: 0,
      paymentDate: new Date().toISOString(),
      nextPaymentDate,
    };
    
    const newPayments: Payment[] = paymentDates.map((dateStr, index) => ({
      id: `${newStudentId}-payment-${index}`,
      studentId: newStudentId,
      amount: 0,
      date: convertToISOString(dateStr),
      note: 'Запланированный платеж',
    }));
    
    setState(prev => ({
      ...prev,
      students: [...prev.students, newStudent],
      payments: [...prev.payments, ...newPayments],
    }));
  }, []);

  const addPayment = useCallback((studentId: string, amount: number, note: string, paymentDate?: string) => {
    const newPayment: Payment = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      studentId,
      amount,
      date: paymentDate ? convertToISOString(paymentDate) : new Date().toISOString(),
      note,
    };
    
    setState(prev => ({
      ...prev,
      students: prev.students.map(s =>
        s.id === studentId ? { ...s, paidAmount: s.paidAmount + amount } : s
      ),
      payments: [...prev.payments, newPayment],
    }));
  }, []);

  const updatePayment = useCallback((paymentId: string, studentId: string, oldAmount: number, newAmount: number) => {
    const diff = newAmount - oldAmount;
    
    setState(prev => ({
      ...prev,
      students: prev.students.map(s =>
        s.id === studentId ? { ...s, paidAmount: s.paidAmount + diff } : s
      ),
      payments: prev.payments.map(p =>
        p.id === paymentId ? { ...p, amount: newAmount } : p
      ),
    }));
  }, []);

  const updateStudent = useCallback((id: string, updates: Partial<Student>) => {
    setState(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  }, []);

  const deleteStudent = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      students: prev.students.filter(s => s.id !== id),
      payments: prev.payments.filter(p => p.studentId !== id),
    }));
  }, []);

  const deletePayment = useCallback((paymentId: string, studentId: string, amount: number) => {
    setState(prev => ({
      ...prev,
      students: prev.students.map(s =>
        s.id === studentId ? { ...s, paidAmount: Math.max(0, s.paidAmount - amount) } : s
      ),
      payments: prev.payments.filter(p => p.id !== paymentId),
    }));
  }, []);

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