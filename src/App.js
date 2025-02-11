import './App.css';
import React, { useEffect, useState } from "react";

// 1) Import Recharts components
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Import settings and utilities
import { COLORS, EXCLUDED_GROUPS, CHART_CONFIG } from './config/settings';
import { formatCurrency, getSpendingStatus } from './utils/formatters';
import { YNABService } from './services/ynabApi';

function App() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [error, setError] = useState(null);
  const [ytdSpending, setYtdSpending] = useState({});
  const [transactions, setTransactions] = useState({});
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Access token from .env
  const token = process.env.REACT_APP_YNAB_ACCESS_TOKEN;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Fetch budgets
        const budgetsResponse = await fetch("https://api.youneedabudget.com/v1/budgets", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!budgetsResponse.ok) throw new Error("Failed to fetch budgets");

        const budgetsData = await budgetsResponse.json();
        if (!budgetsData.data.budgets || budgetsData.data.budgets.length === 0) {
          throw new Error("No budgets found");
        }

        // Take the first budget
        const budgetId = budgetsData.data.budgets[0].id;

        // Fetch categories for that budget
        const categoriesResponse = await fetch(
          `https://api.youneedabudget.com/v1/budgets/${budgetId}/categories`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!categoriesResponse.ok) throw new Error("Failed to fetch categories");

        const categoriesData = await categoriesResponse.json();

        // After getting the budget ID, fetch YTD transactions
        const startDate = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
        const transactionsResponse = await fetch(
          `https://api.youneedabudget.com/v1/budgets/${budgetId}/transactions?since_date=${startDate}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!transactionsResponse.ok) throw new Error("Failed to fetch transactions");

        const transactionsData = await transactionsResponse.json();
        
        // Organize transactions by category
        const transactionsByCategory = {};
        const spendingByCategory = {};
        
        transactionsData.data.transactions.forEach(transaction => {
          if (transaction.category_id) {
            // Add to spending total
            spendingByCategory[transaction.category_id] = (spendingByCategory[transaction.category_id] || 0) + 
              Math.abs(transaction.amount);
            
            // Add to transactions list
            if (!transactionsByCategory[transaction.category_id]) {
              transactionsByCategory[transaction.category_id] = [];
            }
            transactionsByCategory[transaction.category_id].push(transaction);
          }
        });
        
        setTransactions(transactionsByCategory);
        setYtdSpending(spendingByCategory);
        setCategories(categoriesData.data.category_groups);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchCategories();
  }, [token]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>Error: {error}</div>;
  }

  // 3) Flatten all categories for easier calculations & chart data
  const flattenedCategories = categories
    .filter(group => !group.name.includes("Contingency"))
    .flatMap(group => group.categories);
  
  // 4) Calculate total yearly budget (sum of all `goal_target`s)
  const totalYearlyBudget = flattenedCategories.reduce((sum, cat) => sum + (cat.goal_target || 0), 0);

  // 5) Prepare data for the pie chart
  //    "value" is the numeric field used for the pie chart
  //    "name" is the label


 // Prepare group-level data
 const groupData = categories
   .filter(group => !EXCLUDED_GROUPS.some(excluded => group.name.includes(excluded)))
   .map(group => ({
     name: group.name,
     value: group.categories.reduce((sum, cat) => sum + (cat.goal_target || 0), 0)
   }));

// Prepare category-level data for selected group
const categoryData = selectedGroup ? 
 categories
   .find(group => group.name === selectedGroup)
   ?.categories
   .map(cat => ({
     name: cat.name,
     value: cat.goal_target || 0
   })) || [] 
 : [];

// Determine which data to show
const chartData = selectedGroup ? categoryData : groupData;

// Update the helper function to use the YTD spending data
const calculateYTDSpending = (categories) => {
  return categories.reduce((sum, cat) => sum + (ytdSpending[cat.id] || 0), 0);
};

// Add this helper function inside App component
const getSpendingStatus = (yearlyBudget, ytdSpent) => {
  // Get current month (0-11)
  const currentMonth = new Date().getMonth();
  // Calculate expected spending for the year so far
  const expectedSpending = (yearlyBudget / 12) * (currentMonth + 1);
  
  if (ytdSpent > yearlyBudget) {
    return { color: 'red', width: '100%' };
  } else if (ytdSpent > expectedSpending) {
    return { color: 'yellow', width: `${(ytdSpent / yearlyBudget) * 100}%` };
  } else {
    return { color: 'green', width: `${(ytdSpent / yearlyBudget) * 100}%` };
  }
};

return (
  <div className="min-h-screen bg-gray-100 py-8">
    <div className="container mx-auto px-4 max-w-[21cm]"> {/* A4 width */}
      <div className="bg-white shadow-lg rounded-lg min-h-[29.7cm] p-12"> {/* A4 height */}
        <h1 className="text-3xl font-bold mb-2 text-gray-800 text-center">
          Yearly Budget Overview
        </h1>
        <h2 className="text-xl text-gray-600 mb-8 text-center">
          Total Yearly Budget: {formatCurrency(totalYearlyBudget)}
        </h2>
        
        <div className="mb-12">
          <div style={{ position: 'relative', height: '500px', maxWidth: '1000px', margin: '0 auto' }}>
            {selectedGroup && (
              <button
                onClick={() => setSelectedGroup(null)}
                className="absolute top-0 left-0 z-10 bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600 transition-colors duration-200 flex items-center gap-1"
              >
                <span>←</span> Back to Groups
              </button>
            )}
            <ResponsiveContainer>
              <PieChart>
                <Pie 
                  data={chartData} 
                  dataKey="value" 
                  nameKey="name" 
                  outerRadius={150}
                  cx={250}
                  cy={220}
                  onClick={(data) => {
                    if (!selectedGroup) {
                      setSelectedGroup(data.name);
                    }
                  }}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    const RADIAN = Math.PI / 180;
                    if (percent < 0.05) return null;
                    const radius = outerRadius + 25;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text 
                        x={x} 
                        y={y} 
                        fill="#4B5563"
                        fontSize="14"
                        fontWeight="500"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                      >
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      style={{ cursor: selectedGroup ? 'default' : 'pointer' }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '8px',
                    padding: '12px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name) => [
                    `${formatCurrency(value)} (${((value / totalYearlyBudget) * 100).toFixed(1)}%)`,
                    name
                  ]}
                />
                <Legend 
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  formatter={(value, entry) => {
                    const percentage = ((entry.payload.value / totalYearlyBudget) * 100).toFixed(1);
                    return (
                      <span className="text-sm text-gray-600 whitespace-nowrap">
                        {entry.payload.name} • <span className="font-medium">{formatCurrency(entry.payload.value)}</span> <span className="text-gray-500">({percentage}%)</span>
                      </span>
                    );
                  }}
                  wrapperStyle={{
                    left: 500,
                    top: 50,
                    width: 400,
                    '@media print': {
                      position: 'absolute !important',
                      left: 'auto !important',
                      right: '-50px !important',
                      top: '50% !important',
                      transform: 'translateY(-50%) !important'
                    }
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4 print:space-y-2">
          {categories
            .filter(group => !EXCLUDED_GROUPS.some(excluded => group.name.includes(excluded)))
            .map((group) => {
              const groupTotal = group.categories.reduce((sum, cat) => sum + (cat.goal_target || 0), 0);
              const groupPercentage = ((groupTotal / totalYearlyBudget) * 100).toFixed(1);
              const groupYTDSpending = calculateYTDSpending(group.categories);
              return (
                <div key={group.name} className="bg-white rounded-lg shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-semibold text-gray-900">
                        {group.name} 
                        <span className="ml-4 text-sm font-medium text-gray-500">
                          • Budget: {formatCurrency(groupTotal)} • {groupPercentage}%
                          • YTD Spent: {formatCurrency(groupYTDSpending)}
                        </span>
                      </h3>
                    </div>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 w-2/5">Category</th>
                        <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 w-1/5">Yearly Budget</th>
                        <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 w-1/5">YTD Spent</th>
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 w-1/5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {group.categories
                        .sort((a, b) => (b.goal_target || 0) - (a.goal_target || 0))
                        .map((category) => {
                          const spent = ytdSpending[category.id] || 0;
                          const budget = category.goal_target || 0;
                          const status = getSpendingStatus(budget, spent);
                          const isExpanded = expandedCategory === category.id;
                          const categoryTransactions = transactions[category.id] || [];
                          
                          return (
                            <>
                              <tr
                                key={category.name}
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                              >
                                <td className="px-6 py-3 text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <span className="transform transition-transform duration-200" style={{
                                      display: 'inline-block',
                                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                                    }}>▶</span>
                                    {category.name}
                                  </div>
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-900 tabular-nums font-medium text-right">
                                  {formatCurrency(budget)}
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-900 tabular-nums font-medium text-right">
                                  {formatCurrency(spent)}
                                </td>
                                <td className="px-6 py-3">
                                  <div style={{
                                    width: '200px',
                                    height: '12px',
                                    backgroundColor: '#e5e7eb',
                                    borderRadius: '9999px',
                                    overflow: 'hidden',
                                    display: 'block',
                                    position: 'relative'
                                  }}>
                                    <div
                                      style={{
                                        height: '100%',
                                        borderRadius: '9999px',
                                        transition: 'all 0.3s',
                                        width: status.width,
                                        backgroundColor: status.color === 'red' ? '#ef4444' : 
                                                       status.color === 'yellow' ? '#f59e0b' : 
                                                       '#22c55e',
                                        position: 'relative'
                                      }}
                                    >
                                      <span style={{
                                        position: 'absolute',
                                        right: '4px',
                                        top: '-1px',
                                        fontSize: '10px',
                                        color: 'rgba(255, 255, 255, 0.9)',
                                        fontWeight: '500'
                                      }}>
                                        {Math.round((spent / budget) * 100)}%
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr>
                                  <td colSpan="4" className="px-6 py-3">
                                    <div className="bg-white rounded-lg shadow-sm p-4 mx-2 my-1">
                                      <div className="text-sm">
                                        <div className="mb-3 text-gray-500 font-medium">
                                          Recent Transactions
                                        </div>
                                        <table className="w-full">
                                          <thead>
                                            <tr className="border-b border-gray-200">
                                              <th className="px-4 py-2 text-left w-1/4 text-xs font-medium text-gray-500">Date</th>
                                              <th className="px-4 py-2 text-left w-1/2 text-xs font-medium text-gray-500">Payee</th>
                                              <th className="px-6 py-2 text-right w-1/4 text-xs font-medium text-gray-500">Amount</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100">
                                            {categoryTransactions
                                              .sort((a, b) => new Date(b.date) - new Date(a.date))
                                              .map(transaction => (
                                                <tr 
                                                  key={transaction.id} 
                                                  className="hover:bg-gray-50 transition-colors duration-150"
                                                >
                                                  <td className="px-4 py-2.5 text-gray-600">
                                                    {new Date(transaction.date).toLocaleDateString('en-GB', {
                                                      day: '2-digit',
                                                      month: 'short',
                                                      year: 'numeric'
                                                    })}
                                                  </td>
                                                  <td className="px-4 py-2.5 text-gray-900">{transaction.payee_name}</td>
                                                  <td className="px-6 py-2.5 text-right text-gray-900 font-medium tabular-nums">
                                                    {formatCurrency(Math.abs(transaction.amount))}
                                                  </td>
                                                </tr>
                                              ))}
                                          </tbody>
                                          <tfoot className="border-t border-gray-200">
                                            <tr>
                                              <td colSpan="2" className="px-4 py-3 text-right text-gray-600 font-medium">
                                                Total Transactions:
                                              </td>
                                              <td className="px-6 py-3 text-right text-gray-900 font-medium tabular-nums">
                                                {formatCurrency(categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0))}
                                              </td>
                                            </tr>
                                          </tfoot>
                                        </table>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  </div>
);
}
export default App;