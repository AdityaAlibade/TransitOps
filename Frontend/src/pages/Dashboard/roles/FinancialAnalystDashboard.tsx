import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WelcomeCard, KPICard } from '../../../components/Cards/Cards';
import { OperatingExpensesChart } from '../../../components/Charts/Charts';
import { api } from '../../../services/api';
import { Loader } from '../../../components/Loader/Loader';
import { 
  FiDollarSign, 
  FiFileText, 
  FiTrendingUp, 
  FiCreditCard,
  FiArrowRight
} from 'react-icons/fi';

interface Expense {
  id: number;
  vehicle_id: number | null;
  trip_id: number | null;
  expense_type: string;
  amount: string;
  expense_date: string;
  description: string | null;
  vehicle?: {
    registration_number: string;
    name_model: string;
  };
}

export const FinancialAnalystDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseChartData, setExpenseChartData] = useState<any[]>([]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses');
      const allExpenses: Expense[] = res.data.data || [];
      setExpenses(allExpenses);

      // Aggregating expenses for charts
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const expenseAgg: Record<string, { Fuel: number; Maintenance: number; Toll: number; Other: number }> = {};
      months.forEach(m => {
        expenseAgg[m] = { Fuel: 0, Maintenance: 0, Toll: 0, Other: 0 };
      });

      allExpenses.forEach((exp) => {
        const d = new Date(exp.expense_date);
        if (!isNaN(d.getTime())) {
          const monthName = months[d.getMonth()];
          const type = exp.expense_type as 'Fuel' | 'Maintenance' | 'Toll' | 'Other';
          if (expenseAgg[monthName] && type in expenseAgg[monthName]) {
            expenseAgg[monthName][type] += Number(exp.amount);
          }
        }
      });

      const formattedExpenseChart = months.map(m => ({
        name: m,
        Fuel: expenseAgg[m].Fuel,
        Maintenance: expenseAgg[m].Maintenance,
        Toll: expenseAgg[m].Toll,
        Other: expenseAgg[m].Other
      }));
      setExpenseChartData(formattedExpenseChart);
    } catch (err) {
      console.error('Error fetching financial dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader />
      </div>
    );
  }

  // Calculations
  const operationalExpenses = expenses.filter(e => e.expense_type !== 'Other');
  
  const totalExp = operationalExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const fuelExp = expenses.filter(e => e.expense_type === 'Fuel').reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const maintenanceExp = expenses.filter(e => e.expense_type === 'Maintenance').reduce((sum, e) => sum + parseFloat(e.amount), 0);
  
  // Seed file treats Expense type 'Other' as client payment proxy revenue
  const totalRevenue = expenses.filter(e => e.expense_type === 'Other').reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <div className="space-y-6">
      <WelcomeCard />

      {/* Financial KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Operating Expenses"
          value={`₹${totalExp.toLocaleString()}`}
          icon={FiDollarSign}
          change="Aggregated costs logged"
          trend="down"
          color="blue"
        />
        <KPICard
          title="Fuel Purchases"
          value={`₹${fuelExp.toLocaleString()}`}
          icon={FiCreditCard}
          change="Transit fleet fuel cost"
          trend="up"
          color="green"
        />
        <KPICard
          title="Service Repairs Cost"
          value={`₹${maintenanceExp.toLocaleString()}`}
          icon={FiTrendingUp}
          change="Fleet maintenance log sum"
          trend="up"
          color="purple"
        />
        <KPICard
          title="Client Revenue Proxy"
          value={`₹${totalRevenue.toLocaleString()}`}
          icon={FiFileText}
          change="Completed delivery payments"
          trend="up"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expenses Chart */}
        <div className="lg:col-span-2">
          <OperatingExpensesChart 
            data={expenseChartData} 
            title="Operating Expenses Trends" 
            description="Aggregates monthly fuel, repairs, and miscellaneous costs" 
          />
        </div>

        {/* Financial Actions shortcuts */}
        <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-800">Financial Workflows</h3>
              <p className="text-xs text-slate-400">Manage expenses and compile logs</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/expenses')}
                className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-2xl text-xs font-bold transition duration-150 cursor-pointer"
              >
                <span>Log Corporate Expense</span>
                <FiDollarSign className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/reports')}
                className="w-full flex items-center justify-between px-4 py-3 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-2xl text-xs font-bold transition duration-150 cursor-pointer"
              >
                <span>Export Finance Reports</span>
                <FiFileText className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] text-slate-450 leading-relaxed">
            <span className="font-bold text-slate-700 block mb-0.5">Analyst Note</span>
            Financial indicators and charts display operational summaries based on invoices logged in the database.
          </div>
        </div>
      </div>

      {/* Recent High Value Expenses */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-slate-800">Recent High-Value Expenses</h3>
          <button 
            onClick={() => navigate('/expenses')}
            className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>View All Expenses</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase">
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">Assigned Vehicle</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {operationalExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">No expenses recorded.</td>
                </tr>
              ) : (
                operationalExpenses.slice(0, 5).map(e => (
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 text-slate-500">{new Date(e.expense_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800">{e.expense_type}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{e.description || '--'}</td>
                    <td className="py-3 px-4 font-semibold text-slate-650">
                      {e.vehicle ? `${e.vehicle.registration_number} (${e.vehicle.name_model})` : 'General'}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-800">₹{parseFloat(e.amount).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
