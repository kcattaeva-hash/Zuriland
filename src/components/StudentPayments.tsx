import { useState, useMemo, useCallback, memo } from 'react';
import { Badge } from './ui/badge';
import { DollarSign, Trash2, Edit, Search, TrendingUp, TrendingDown, Wallet, Package, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { Student, Payment } from '../App';
import { EditStudentDialog } from './EditStudentDialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { formatDateInput } from '../utils/dateFormatter';
import { useDebounce } from '../hooks/useDebounce';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { PaymentDialog } from './PaymentDialog';

interface StudentPaymentsProps {
  students: Student[];
  payments: Payment[];
  onAddPayment: (studentId: string, amount: number, note: string, paymentDate?: string) => void;
  onUpdateStudent: (id: string, updates: Partial<Student>) => void;
  onDeleteStudent: (id: string) => void;
  onDeletePayment: (paymentId: string, studentId: string, amount: number) => void;
  onUpdatePayment: (paymentId: string, studentId: string, oldAmount: number, newAmount: number) => void;
}

// Memoized utility functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  try {
    if (!dateString) return 'Не указана';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Не указана';
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch (error) {
    return 'Не указана';
  }
};

const getAvatarGradient = (name: string) => {
  const gradients = [
    'from-stone-400 via-stone-500 to-stone-600',
    'from-green-500 via-green-600 to-green-700',
    'from-amber-600 via-amber-700 to-yellow-800',
    'from-stone-500 via-green-600 to-stone-700',
    'from-green-600 via-stone-600 to-amber-700',
    'from-amber-700 via-stone-600 to-green-700',
  ];
  const index = name.length % gradients.length;
  return gradients[index];
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Memoized Payment History Row Component
const PaymentHistoryRow = memo(({ 
  payment, 
  studentId, 
  editingPayment, 
  editPaymentValue,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onEditPaymentValueChange
}: {
  payment: Payment;
  studentId: string;
  editingPayment: string | null;
  editPaymentValue: string;
  onStartEditing: (paymentId: string, amount: number) => void;
  onSaveEdit: (payment: Payment, studentId: string) => void;
  onCancelEdit: () => void;
  onDelete: (paymentId: string, studentId: string, amount: number) => void;
  onEditPaymentValueChange: (value: string) => void;
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-green-200/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 flex-1">
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-lg">
          <DollarSign className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div 
            className="group/payment cursor-pointer inline-flex items-center gap-2 px-2 py-1 rounded hover:bg-green-100 transition-colors"
            onClick={() => onStartEditing(payment.id, payment.amount)}
          >
            {editingPayment === payment.id ? (
              <Input
                type="number"
                value={editPaymentValue}
                onChange={(e) => onEditPaymentValueChange(e.target.value)}
                onBlur={() => onSaveEdit(payment, studentId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveEdit(payment, studentId);
                  if (e.key === 'Escape') onCancelEdit();
                }}
                className="w-28 h-8 text-sm"
              />
            ) : (
              <>
                <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                <Edit className="w-3 h-3 text-gray-400 opacity-0 group-hover/payment:opacity-100 transition-opacity" />
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(payment.date)}</span>
          </div>
          {payment.note && (
            <p className="text-sm text-gray-600 mt-1">{payment.note}</p>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(payment.id, studentId, payment.amount)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
});

PaymentHistoryRow.displayName = 'PaymentHistoryRow';

// Memoized Student Row Component
const StudentRow = memo(({
  student,
  index,
  debt,
  isExpanded,
  studentPayments,
  editingCell,
  editValue,
  editingPayment,
  editPaymentValue,
  onToggleRow,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onStartEditingPayment,
  onSavePaymentEdit,
  onCancelPaymentEdit,
  onAddPayment,
  onEditStudent,
  onDeleteStudent,
  onDeletePayment,
  onEditValueChange,
  onEditPaymentValueChange,
}: {
  student: Student;
  index: number;
  debt: number;
  isExpanded: boolean;
  studentPayments: Payment[];
  editingCell: { studentId: string; field: 'debtAmount' | 'paidAmount' | 'nextPaymentDate' } | null;
  editValue: string;
  editingPayment: string | null;
  editPaymentValue: string;
  onToggleRow: (id: string) => void;
  onStartEditing: (studentId: string, field: 'debtAmount' | 'paidAmount' | 'nextPaymentDate', currentValue: number | string) => void;
  onSaveEdit: (studentId: string, field: 'debtAmount' | 'paidAmount' | 'nextPaymentDate') => void;
  onCancelEdit: () => void;
  onStartEditingPayment: (paymentId: string, currentAmount: number) => void;
  onSavePaymentEdit: (payment: Payment, studentId: string) => void;
  onCancelPaymentEdit: () => void;
  onAddPayment: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
  onDeletePayment: (paymentId: string, studentId: string, amount: number) => void;
  onEditValueChange: (value: string) => void;
  onEditPaymentValueChange: (value: string) => void;
}) => {
  // Simplified animations for better performance
  const shouldAnimate = index < 20; // Only animate first 20 items
  
  return (
    <>
      <tr className="group hover:bg-amber-50/50 transition-colors border-slate-200/50">
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleRow(student.id)}
            className="p-0 h-8 w-8"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </Button>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(student.name)} flex items-center justify-center text-white shadow-lg`}>
              {getInitials(student.name)}
            </div>
            <div>
              <p className="font-medium text-gray-900">{student.name}</p>
              {student.phone && (
                <p className="text-xs text-gray-500">{student.phone}</p>
              )}
              <div 
                className="group/edit cursor-pointer inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded hover:bg-blue-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEditing(student.id, 'nextPaymentDate', student.nextPaymentDate || '');
                }}
              >
                {editingCell?.studentId === student.id && editingCell?.field === 'nextPaymentDate' ? (
                  <Input
                    type="text"
                    placeholder="ДД.ММ.ГГГГ"
                    value={editValue}
                    onChange={(e) => onEditValueChange(formatDateInput(e.target.value))}
                    onBlur={() => onSaveEdit(student.id, 'nextPaymentDate')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSaveEdit(student.id, 'nextPaymentDate');
                      if (e.key === 'Escape') onCancelEdit();
                    }}
                    maxLength={10}
                    className="w-24 h-6 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    {student.nextPaymentDate ? (
                      <>
                        <Calendar className="w-3 h-3 text-blue-600" />
                        <span className="text-xs text-blue-700">{student.nextPaymentDate}</span>
                        <Edit className="w-2.5 h-2.5 text-gray-400 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                      </>
                    ) : (
                      <>
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">Не указано</span>
                        <Edit className="w-2.5 h-2.5 text-gray-400 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-600" />
            <span className="text-gray-700">{student.productName}</span>
          </div>
        </TableCell>
        <TableCell>
          <div 
            className="group/edit cursor-pointer inline-flex items-center gap-2 px-2 py-1 rounded hover:bg-amber-100 transition-colors"
            onClick={() => onStartEditing(student.id, 'debtAmount', student.debtAmount)}
          >
            {editingCell?.studentId === student.id && editingCell?.field === 'debtAmount' ? (
              <Input
                type="number"
                value={editValue}
                onChange={(e) => onEditValueChange(e.target.value)}
                onBlur={() => onSaveEdit(student.id, 'debtAmount')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveEdit(student.id, 'debtAmount');
                  if (e.key === 'Escape') onCancelEdit();
                }}
                className="w-24 h-8 text-sm"
              />
            ) : (
              <>
                <span className="text-gray-900">{formatCurrency(student.debtAmount)}</span>
                <Edit className="w-3 h-3 text-gray-400 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
              </>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div 
            className="group/edit cursor-pointer inline-flex items-center gap-2 px-2 py-1 rounded hover:bg-green-100 transition-colors"
            onClick={() => onStartEditing(student.id, 'paidAmount', student.paidAmount)}
          >
            {editingCell?.studentId === student.id && editingCell?.field === 'paidAmount' ? (
              <Input
                type="number"
                value={editValue}
                onChange={(e) => onEditValueChange(e.target.value)}
                onBlur={() => onSaveEdit(student.id, 'paidAmount')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveEdit(student.id, 'paidAmount');
                  if (e.key === 'Escape') onCancelEdit();
                }}
                className="w-24 h-8 text-sm"
              />
            ) : (
              <>
                <span className="text-green-700">{formatCurrency(student.paidAmount)}</span>
                <Edit className="w-3 h-3 text-gray-400 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
              </>
            )}
          </div>
        </TableCell>
        <TableCell>
          {debt > 0 ? (
            <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
              {formatCurrency(debt)}
            </Badge>
          ) : (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              Оплачено
            </Badge>
          )}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddPayment(student)}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditStudent(student)}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteStudent(student)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </tr>

      {/* Expandable Payment History */}
      {isExpanded && (
        <tr className="bg-green-50/30">
          <TableCell colSpan={7} className="p-0">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-green-600" />
                <h4 className="font-medium text-gray-900">История платежей</h4>
              </div>
              {studentPayments.length > 0 ? (
                <div className="space-y-3">
                  {studentPayments.map((payment) => (
                    <PaymentHistoryRow
                      key={payment.id}
                      payment={payment}
                      studentId={student.id}
                      editingPayment={editingPayment}
                      editPaymentValue={editPaymentValue}
                      onStartEditing={onStartEditingPayment}
                      onSaveEdit={onSavePaymentEdit}
                      onCancelEdit={onCancelPaymentEdit}
                      onDelete={onDeletePayment}
                      onEditPaymentValueChange={onEditPaymentValueChange}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Платежи отсутствуют</p>
              )}
            </div>
          </TableCell>
        </tr>
      )}
    </>
  );
});

StudentRow.displayName = 'StudentRow';

export function StudentPayments({
  students,
  payments,
  onAddPayment,
  onUpdateStudent,
  onDeleteStudent,
  onDeletePayment,
  onUpdatePayment,
}: StudentPaymentsProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'debt' | 'paid'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'debt'>('name');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ studentId: string; field: 'debtAmount' | 'paidAmount' | 'nextPaymentDate' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [editPaymentValue, setEditPaymentValue] = useState('');

  // Debounced search with useMemo
  const debouncedSearch = useDebounce(searchQuery.toLowerCase().trim(), 300);

  // Memoized payment lookup
  const paymentsByStudent = useMemo(() => {
    const map = new Map<string, Payment[]>();
    payments.forEach(payment => {
      if (!map.has(payment.studentId)) {
        map.set(payment.studentId, []);
      }
      map.get(payment.studentId)!.push(payment);
    });
    // Sort payments by date (ascending - from earliest to latest)
    map.forEach((payments) => {
      payments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    return map;
  }, [payments]);

  const getStudentPayments = useCallback((studentId: string) => {
    return paymentsByStudent.get(studentId) || [];
  }, [paymentsByStudent]);

  // Optimized filtering and sorting
  const filteredAndSortedStudents = useMemo(() => {
    let filtered = students;

    // Apply search filter
    if (debouncedSearch) {
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(debouncedSearch) ||
        student.productName.toLowerCase().includes(debouncedSearch)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => {
        const debt = student.debtAmount - student.paidAmount;
        return statusFilter === 'debt' ? debt > 0 : debt <= 0;
      });
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        const debtA = a.debtAmount - a.paidAmount;
        const debtB = b.debtAmount - b.paidAmount;
        return debtB - debtA;
      }
    });

    return sorted;
  }, [students, debouncedSearch, statusFilter, sortBy]);

  // Memoized callbacks
  const toggleRow = useCallback((studentId: string) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(studentId)) {
        newExpanded.delete(studentId);
      } else {
        newExpanded.add(studentId);
      }
      return newExpanded;
    });
  }, []);

  const handleEditStudent = useCallback((student: Student) => {
    setSelectedStudent(student);
    setEditDialogOpen(true);
  }, []);

  const handleAddPayment = useCallback((student: Student) => {
    setSelectedStudent(student);
    setPaymentDialogOpen(true);
  }, []);

  const handleDeleteStudent = useCallback((student: Student) => {
    setSelectedStudent(student);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (selectedStudent) {
      onDeleteStudent(selectedStudent.id);
      setDeleteDialogOpen(false);
      setSelectedStudent(null);
    }
  }, [selectedStudent, onDeleteStudent]);

  const startEditing = useCallback((studentId: string, field: 'debtAmount' | 'paidAmount' | 'nextPaymentDate', currentValue: number | string) => {
    setEditingCell({ studentId, field });
    setEditValue(currentValue.toString());
  }, []);

  const saveEdit = useCallback((studentId: string, field: 'debtAmount' | 'paidAmount' | 'nextPaymentDate') => {
    if (field === 'nextPaymentDate') {
      // For date field, just save the text value
      onUpdateStudent(studentId, { [field]: editValue });
    } else {
      // For numeric fields, parse as number
      const value = parseFloat(editValue);
      if (!isNaN(value) && value >= 0) {
        onUpdateStudent(studentId, { [field]: value });
      }
    }
    setEditingCell(null);
    setEditValue('');
  }, [editValue, onUpdateStudent]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const startEditingPayment = useCallback((paymentId: string, currentAmount: number) => {
    setEditingPayment(paymentId);
    setEditPaymentValue(currentAmount.toString());
  }, []);

  const savePaymentEdit = useCallback((payment: Payment, studentId: string) => {
    const newAmount = parseFloat(editPaymentValue);
    if (!isNaN(newAmount) && newAmount >= 0) {
      onUpdatePayment(payment.id, studentId, payment.amount, newAmount);
    }
    setEditingPayment(null);
    setEditPaymentValue('');
  }, [editPaymentValue, onUpdatePayment]);

  const cancelPaymentEdit = useCallback(() => {
    setEditingPayment(null);
    setEditPaymentValue('');
  }, []);

  // Memoized summary calculations
  const { totalDebt, totalCollected } = useMemo(() => {
    let debt = 0;
    let collected = 0;
    students.forEach(student => {
      const studentDebt = student.debtAmount - student.paidAmount;
      if (studentDebt > 0) debt += studentDebt;
      collected += student.paidAmount;
    });
    return { totalDebt: debt, totalCollected: collected };
  }, [students]);

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      {/* Summary Cards - Mobile optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-orange-600 to-red-700 opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg">
            <div className="flex items-start justify-between mb-2 md:mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 md:p-3 rounded-lg md:rounded-xl">
                <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
            </div>
            <p className="text-white/90 text-xs md:text-sm mb-1">Общая задолженность</p>
            <p className="text-white text-xl md:text-2xl mb-2 md:mb-3">{formatCurrency(totalDebt)}</p>
          </div>
        </div>

        <div className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-green-600 to-green-700 opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg">
            <div className="flex items-start justify-between mb-2 md:mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 md:p-3 rounded-lg md:rounded-xl">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
            </div>
            <p className="text-white/90 text-xs md:text-sm mb-1">Собрано</p>
            <p className="text-white text-xl md:text-2xl">{formatCurrency(totalCollected)}</p>
          </div>
        </div>

        <div className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-stone-500 via-stone-600 to-stone-700 opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg">
            <div className="flex items-start justify-between mb-2 md:mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 md:p-3 rounded-lg md:rounded-xl">
                <Wallet className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
            </div>
            <p className="text-white/90 text-xs md:text-sm mb-1">Всего записей</p>
            <p className="text-white text-xl md:text-2xl">{students.length}</p>
          </div>
        </div>
      </div>

      {/* Filters - Mobile optimized */}
      <div className="glass rounded-xl md:rounded-2xl p-3 md:p-4 space-y-3 md:space-y-0 md:flex md:items-center md:gap-4 border border-slate-300/50">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/50 border-slate-300/50 h-10 md:h-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 md:flex md:gap-2">
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-full md:w-[160px] bg-white/50 border-slate-300/50 h-10 md:h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">📋 Все статусы</SelectItem>
              <SelectItem value="debt" className="text-xs">🔴 С долгом</SelectItem>
              <SelectItem value="paid" className="text-xs">✅ Оплачено</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-full md:w-[160px] bg-white/50 border-slate-300/50 h-10 md:h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name" className="text-xs">👤 По имени</SelectItem>
              <SelectItem value="debt" className="text-xs">💰 По долгу</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile Card View / Desktop Table */}
      <div className="glass rounded-xl md:rounded-2xl overflow-hidden border border-slate-300/50">
        {/* Table View - Shown on all devices with horizontal scroll */}
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-stone-50/80 via-amber-50/80 to-green-50/80 hover:bg-gradient-to-r border-stone-300/50">
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="min-w-[180px]">ФИО</TableHead>
                <TableHead className="min-w-[150px]">Товар</TableHead>
                <TableHead className="min-w-[100px]">Долг</TableHead>
                <TableHead className="min-w-[100px]">Оплачено</TableHead>
                <TableHead className="min-w-[100px]">Остаток</TableHead>
                <TableHead className="text-right w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedStudents.map((student, index) => {
                const debt = student.debtAmount - student.paidAmount;
                const studentPayments = getStudentPayments(student.id);
                const isExpanded = expandedRows.has(student.id);
                
                return (
                  <StudentRow
                    key={student.id}
                    student={student}
                    index={index}
                    debt={debt}
                    isExpanded={isExpanded}
                    studentPayments={studentPayments}
                    editingCell={editingCell}
                    editValue={editValue}
                    editingPayment={editingPayment}
                    editPaymentValue={editPaymentValue}
                    onToggleRow={toggleRow}
                    onStartEditing={startEditing}
                    onSaveEdit={saveEdit}
                    onCancelEdit={cancelEdit}
                    onStartEditingPayment={startEditingPayment}
                    onSavePaymentEdit={savePaymentEdit}
                    onCancelPaymentEdit={cancelPaymentEdit}
                    onAddPayment={handleAddPayment}
                    onEditStudent={handleEditStudent}
                    onDeleteStudent={handleDeleteStudent}
                    onDeletePayment={onDeletePayment}
                    onEditValueChange={setEditValue}
                    onEditPaymentValueChange={setEditPaymentValue}
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredAndSortedStudents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Записей не найдено</p>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {selectedStudent && (
        <>
          <EditStudentDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            student={selectedStudent}
            onUpdateStudent={onUpdateStudent}
          />

          <PaymentDialog
            open={paymentDialogOpen}
            onOpenChange={setPaymentDialogOpen}
            student={selectedStudent}
            onAddPayment={onAddPayment}
          />
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить запись для {selectedStudent?.name}? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}