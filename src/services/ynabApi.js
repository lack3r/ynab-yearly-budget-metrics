import { API } from '../config/settings';

export class YNABService {
  constructor(token) {
    this.token = token;
    this.headers = {
      Authorization: `Bearer ${token}`,
    };
  }

  async fetchBudgets() {
    const response = await fetch(`${API.baseUrl}${API.budgets}`, {
      headers: this.headers,
    });
    if (!response.ok) throw new Error("Failed to fetch budgets");
    return response.json();
  }

  async fetchCategories(budgetId) {
    const response = await fetch(
      `${API.baseUrl}${API.categories(budgetId)}`,
      { headers: this.headers }
    );
    if (!response.ok) throw new Error("Failed to fetch categories");
    return response.json();
  }

  async fetchTransactions(budgetId, sinceDate) {
    const response = await fetch(
      `${API.baseUrl}${API.transactions(budgetId)}?since_date=${sinceDate}`,
      { headers: this.headers }
    );
    if (!response.ok) throw new Error("Failed to fetch transactions");
    return response.json();
  }
} 