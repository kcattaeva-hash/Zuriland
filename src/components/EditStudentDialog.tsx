import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Student } from '../App';

interface EditStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  onUpdateStudent: (id: string, updates: Partial<Student>) => void;
}

export function EditStudentDialog({ open, onOpenChange, student, onUpdateStudent }: EditStudentDialogProps) {
  const [name, setName] = useState(student.name);
  const [phone, setPhone] = useState(student.phone || '');
  const [productName, setProductName] = useState(student.productName);
  const [debtAmount, setDebtAmount] = useState(student.debtAmount.toString());

  useEffect(() => {
    if (open) {
      setName(student.name);
      setPhone(student.phone || '');
      setProductName(student.productName);
      setDebtAmount(student.debtAmount.toString());
    }
  }, [open, student]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onUpdateStudent(student.id, {
      name,
      phone,
      productName,
      debtAmount: parseFloat(debtAmount),
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать клиента</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">ФИО</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Телефон (опционально)</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-productName">Наименование товара</Label>
              <Input
                id="edit-productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-debtAmount">Сумма долга (₽)</Label>
              <Input
                id="edit-debtAmount"
                type="number"
                value={debtAmount}
                onChange={(e) => setDebtAmount(e.target.value)}
                required
                min="0.01"
                step="0.01"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}