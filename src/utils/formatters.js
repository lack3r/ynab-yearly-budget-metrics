import { CURRENCY_FORMAT_OPTIONS } from '../config/settings';

/**
 * Format YNAB "milliunits" as currency
 * YNAB stores amounts as integer "milliunits," i.e. €10.00 => 10000
 */
export const formatCurrency = (milliunits) => {
  if (!milliunits) return "€0.00";
  return (milliunits / 1000).toLocaleString(
    CURRENCY_FORMAT_OPTIONS.locale, 
    CURRENCY_FORMAT_OPTIONS
  );
};

/**
 * Calculate spending status and return color and width for progress bar
 */
export const getSpendingStatus = (yearlyBudget, ytdSpent) => {
  const currentMonth = new Date().getMonth();
  const expectedSpending = (yearlyBudget / 12) * (currentMonth + 1);
  
  if (ytdSpent > yearlyBudget) {
    return { color: 'red', width: '100%' };
  } else if (ytdSpent > expectedSpending) {
    return { color: 'yellow', width: `${(ytdSpent / yearlyBudget) * 100}%` };
  } else {
    return { color: 'green', width: `${(ytdSpent / yearlyBudget) * 100}%` };
  }
}; 