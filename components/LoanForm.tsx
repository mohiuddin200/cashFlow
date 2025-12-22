import React, { useState } from 'react';
import { Loan, LoanDirection } from '../types';
import { getCurrencySymbol } from '../utils/currency';

interface LoanFormProps {
  onSubmit: (loan: Omit<Loan, 'id'>) => void;
  onCancel: () => void;
  initialData?: Partial<Loan>;
  currency?: string;
}

const LoanForm: React.FC<LoanFormProps> = ({ onSubmit, onCancel, initialData, currency = 'BDT' }) => {
  const [formData, setFormData] = useState({
    personName: initialData?.personName || '',
    personContact: initialData?.personContact || '',
    amount: initialData?.amount || '',
    direction: initialData?.direction || 'given' as LoanDirection,
    date: initialData?.date || new Date().toISOString().split('T')[0],
    dueDate: initialData?.dueDate || '',
    note: initialData?.note || '',
    isConnectedToMoney: initialData?.isConnectedToMoney ?? true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.personName.trim()) {
      newErrors.personName = 'Person name is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (formData.dueDate && new Date(formData.dueDate) < new Date(formData.date)) {
      newErrors.dueDate = 'Due date cannot be before loan date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const loanData: Omit<Loan, 'id'> = {
      personName: formData.personName.trim(),
      personContact: formData.personContact.trim(),
      amount: parseFloat(formData.amount),
      direction: formData.direction,
      date: formData.date,
      note: formData.note.trim(),
      isConnectedToMoney: formData.isConnectedToMoney,
      totalPaid: initialData?.totalPaid || 0,
      remainingAmount: initialData?.remainingAmount || parseFloat(formData.amount),
      status: initialData?.status || 'active',
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Only include dueDate if it has a value
    if (formData.dueDate) {
      (loanData as any).dueDate = formData.dueDate;
    }

    onSubmit(loanData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="p-4 relative z-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          {initialData?.id ? 'Edit Loan' : 'Add New Loan'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Direction Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loan Direction
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleInputChange('direction', 'given')}
              className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                formData.direction === 'given'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💸 Given Out
            </button>
            <button
              type="button"
              onClick={() => handleInputChange('direction', 'taken')}
              className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                formData.direction === 'taken'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💰 Taken In
            </button>
          </div>
        </div>

        {/* Person Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Person Name *
          </label>
          <input
            type="text"
            value={formData.personName}
            onChange={(e) => handleInputChange('personName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
              errors.personName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter person's name"
          />
          {errors.personName && (
            <p className="text-red-500 text-sm mt-1">{errors.personName}</p>
          )}
        </div>

        {/* Person Contact (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact (Optional)
          </label>
          <input
            type="text"
            value={formData.personContact}
            onChange={(e) => handleInputChange('personContact', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
              errors.personContact ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Phone or email"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount *
          </label>
          <div className={`flex items-center border rounded-lg focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 ${
            errors.amount ? 'border-red-500' : 'border-gray-300'
          }`}>
            <span className="px-3 py-2 text-gray-600 border-r border-gray-300 bg-gray-50 rounded-l-lg">
              {currency}
            </span>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className="flex-1 px-3 py-2 rounded-r-lg focus:outline-none"
              placeholder="0.00"
              step="0.01"
            />
          </div>
          {errors.amount && (
            <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loan Date *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
              errors.date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.date && (
            <p className="text-red-500 text-sm mt-1">{errors.date}</p>
          )}
        </div>

        {/* Due Date (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Due Date (Optional)
          </label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => handleInputChange('dueDate', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
              errors.dueDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.dueDate && (
            <p className="text-red-500 text-sm mt-1">{errors.dueDate}</p>
          )}
        </div>

        {/* Connect with Money Toggle */}
        <div>
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <span className="font-medium text-gray-900">Connect with actual money</span>
              <p className="text-sm text-gray-600 mt-1">
                {formData.isConnectedToMoney
                  ? 'Loan will affect your balance calculations'
                  : 'Loan tracked separately from your balance'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleInputChange('isConnectedToMoney', !formData.isConnectedToMoney)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.isConnectedToMoney ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.isConnectedToMoney ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={formData.note}
            onChange={(e) => handleInputChange('note', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
              errors.note ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={2}
            placeholder="Add any notes about this loan..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2 px-4 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 active:scale-95 transition-transform"
          >
            {initialData?.id ? 'Update Loan' : 'Add Loan'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoanForm;