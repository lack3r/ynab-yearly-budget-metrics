/**
 * Application settings and constants
 */

// Chart colors for different categories
export const COLORS = [
  "#0088FE",  // Blue
  "#00C49F",  // Teal
  "#FFBB28",  // Yellow
  "#FF8042",  // Orange
  "#af19ff",  // Purple
  "#8884d8"   // Light Purple
];

// Groups to exclude from the budget overview
export const EXCLUDED_GROUPS = [
  "Contingency",
  "Internal Master Category",
  "Credit Card Payments",
  "Hidden Categories"
];

// Chart configuration
export const CHART_CONFIG = {
  outerRadius: 150,
  centerX: 250,
  centerY: 220,
  minPercentageForLabel: 0.05,  // 5%
  height: 500,
  maxWidth: 1000,
  legendWidth: 400
};

// Currency formatting options
export const CURRENCY_FORMAT_OPTIONS = {
  style: "currency",
  currency: "EUR",
  locale: "en-US"
};

// API endpoints
export const API = {
  baseUrl: process.env.REACT_APP_YNAB_API_URL || "https://api.youneedabudget.com/v1",
  budgets: "/budgets",
  categories: (budgetId) => `/budgets/${budgetId}/categories`,
  transactions: (budgetId) => `/budgets/${budgetId}/transactions`
}; 