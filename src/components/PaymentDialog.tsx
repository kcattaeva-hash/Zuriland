import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Student } from '../App';
import { formatDateInput } from '../utils/dateFormatter';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  onAddPayment: (studentId: string, amount: number, note: string, paymentDate: string) => void;
}

export function PaymentDialog({ open, onOpenChange, student, onAddPayment }: PaymentDialogProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  
  // Format current date as DD.MM.YYYY
  const getCurrentDate = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}.${month}.${year}`;
  };
  
  const [paymentDate, setPaymentDate] = useState(getCurrentDate());

  const remainingDebt = student.debtAmount - student.paidAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentAmount = parseFloat(amount);
    if (paymentAmount > 0) {
      onAddPayment(student.id, paymentAmount, note, paymentDate);
      setAmount('');
      setNote('');
      setPaymentDate(getCurrentDate());
      onOpenChange(false);
    }
  };

  const handleFullPayment = () => {
    if (remainingDebt > 0) {
      setAmount(remainingDebt.toString());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Внести платеж</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 p-3 rounded-lg space-y-1">
              <p className="text-sm text-gray-600">Клиент: <span className="font-medium text-gray-900">{student.name}</span></p>
              <p className="text-sm text-gray-600">Товар: <span className="font-medium text-gray-900">{student.productName}</span></p>
              <p className="text-sm text-gray-600">Остаток: <span className="font-medium text-red-600">
                {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(remainingDebt)}
              </span></p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount">Сумма платежа (₽)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleFullPayment}
                  className="text-amber-600"
                >
                  Оплатить полностью
                </Button>
              </div>
              <Input
                id="amount"
                type="number"
                placeholder="5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="0.01"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">Дата платежа</Label>
              <Input
                id="paymentDate"
                type="text"
                placeholder="ДД.ММ.ГГГГ"
                value={paymentDate}
                onChange={(e) => setPaymentDate(formatDateInput(e.target.value))}
                maxLength={10}
                pattern="\d{2}\.\d{2}\.\d{4}"
                title="Формат: ДД.ММ.ГГГГ (например, 13.04.2026)"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Примечание (опционально)</Label>
              <Input
                id="note"
                placeholder="Наличные, карта и т.д."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Внести
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}