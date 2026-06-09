"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Receipt, Trash2 } from "lucide-react";
import Button from "@/components/ui/button";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Modal from "@/components/ui/modal";
import ExpenseForm from "@/components/expenses/expense-form";
import Select from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  recordedBy: { id: string; name: string } | null;
}

export default function ManagerExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");

  const fetchExpenses = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.set("category", categoryFilter);
      const res = await fetch(`/api/expenses?${params}`);
      if (res.ok) setExpenses(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) fetchExpenses();
    } catch (err) {
      console.error(err);
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500">Track PG expenses</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Add Expense
        </Button>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
            <Receipt className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: "", label: "All Categories" },
              { value: "ELECTRICITY", label: "Electricity" },
              { value: "WATER", label: "Water" },
              { value: "GROCERIES", label: "Groceries" },
              { value: "MAINTENANCE", label: "Maintenance" },
              { value: "SALARY", label: "Salary" },
              { value: "INTERNET", label: "Internet" },
              { value: "OTHER", label: "Other" },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Expenses</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Badge variant="warning">{expense.category.replace("_", " ")}</Badge>
                  <div>
                    <p className="font-medium text-gray-900">{expense.description}</p>
                    <p className="text-sm text-gray-500">{formatDate(expense.expenseDate)} • {expense.recordedBy?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-gray-900">{formatCurrency(Number(expense.amount))}</p>
                  <button onClick={() => handleDelete(expense.id)} className="p-2 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
            {expenses.length === 0 && <p className="text-center text-gray-500 py-8">No expenses</p>}
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Expense" size="lg">
        <ExpenseForm onSuccess={() => { setShowModal(false); fetchExpenses(); }} />
      </Modal>
    </div>
  );
}
