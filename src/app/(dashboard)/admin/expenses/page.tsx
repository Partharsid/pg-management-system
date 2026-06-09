"use client";

import { useEffect, useState } from "react";
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

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => { fetchExpenses(); }, [categoryFilter]);

  async function fetchExpenses() {
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.set("category", categoryFilter);
      const res = await fetch(`/api/expenses?${params}`);
      if (res.ok) setExpenses(await res.json());
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) fetchExpenses();
    } catch (error) { console.error(error); }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Expenses</h1><p className="text-gray-500">Track PG expenses</p></div>
        <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> Add Expense</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center"><Receipt className="w-6 h-6 text-red-600" /></div>
            <div><p className="text-sm text-gray-500">Total Expenses</p><p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
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
                { value: "GAS", label: "Gas" },
                { value: "OTHER", label: "Other" },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold">Expense List</h3></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recorded By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><Badge variant="warning">{expense.category.replace("_", " ")}</Badge></td>
                    <td className="px-4 py-3 text-gray-900">{expense.description}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(Number(expense.amount))}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(expense.expenseDate)}</td>
                    <td className="px-4 py-3 text-gray-500">{expense.recordedBy?.name || "N/A"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(expense.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expenses.length === 0 && <p className="text-center text-gray-500 py-8">No expenses found</p>}
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Expense" size="lg">
        <ExpenseForm onSuccess={() => { setShowModal(false); fetchExpenses(); }} />
      </Modal>
    </div>
  );
}
