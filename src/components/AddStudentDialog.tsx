import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Student } from '../App';
import { formatDateInput } from '../utils/dateFormatter';
import { Plus, X, Calendar } from 'lucide-react';

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddStudent: (student: Omit<Student, 'id' | 'paidAmount' | 'paymentDate'>, paymentDates: string[]) => void;
}

export function AddStudentDialog({ open, onOpenChange, onAddStudent }: AddStudentDialogProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [productName, setProductName] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [paymentDates, setPaymentDates] = useState<string[]>(['']);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty dates
    const validDates = paymentDates.filter(date => date.length === 10);
    
    onAddStudent({
      name,
      phone,
      productName,
      debtAmount: parseFloat(debtAmount),
      nextPaymentDate: undefined, // Will be calculated automatically
    }, validDates);

    // Reset form
    setName('');
    setPhone('');
    setProductName('');
    setDebtAmount('');
    setPaymentDates(['']);
    onOpenChange(false);
  };

  const addPaymentDateField = () => {
    setPaymentDates([...paymentDates, '']);
  };

  const removePaymentDateField = (index: number) => {
    if (paymentDates.length > 1) {
      setPaymentDates(paymentDates.filter((_, i) => i !== index));
    }
  };

  const updatePaymentDate = (index: number, value: string) => {
    const newDates = [...paymentDates];
    newDates[index] = value;
    setPaymentDates(newDates);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить клиента</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">ФИО</Label>
              <Input
                id="name"
                placeholder="Иванов Иван Иванович"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Телефон (опционально)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productName">Наименование товара</Label>
              <Input
                id="productName"
                placeholder="Холодильник Samsung"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="debtAmount">Сумма долга (₽)</Label>
              <Input
                id="debtAmount"
                type="number"
                placeholder="50000"
                value={debtAmount}
                onChange={(e) => setDebtAmount(e.target.value)}
                required
                min="0.01"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  Даты платежей (опционально)
                </Label>
                <Button 
                  type="button" 
                  onClick={addPaymentDateField} 
                  size="sm"
                  variant="outline"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Добавить
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {paymentDates.map((date, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="ДД.ММ.ГГГГ"
                      value={date}
                      onChange={(e) => updatePaymentDate(index, formatDateInput(e.target.value))}
                      maxLength={10}
                      className="flex-1"
                    />
                    {paymentDates.length > 1 && (
                      <Button 
                        type="button" 
                        onClick={() => removePaymentDateField(index)} 
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                💡 Введите все даты платежей. Система автоматически покажет следующую дату.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
              Добавить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}