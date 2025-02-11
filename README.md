# YNAB Budget Overview

A React application that provides a visual overview of your YNAB (You Need A Budget) yearly budget, including spending patterns and transaction history.

## Features

- Pie chart visualization of budget categories
- Detailed breakdown of spending by category
- YTD spending progress bars
- Transaction history for each category
- Print-friendly layout
- Responsive design

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- YNAB account with API access

### Environment Configuration

1. Copy the environment template file:
   ```bash
   cp .env.example .env
   ```

2. Get your YNAB API token:
   - Log in to your YNAB account
   - Go to Account Settings
   - Scroll down to "Developer Settings"
   - Click "New Token" and copy it

3. Update your `.env` file:
   ```env
   REACT_APP_YNAB_ACCESS_TOKEN=your_ynab_access_token_here
   ```

### Installation

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

2. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Usage

- View overall budget distribution in the pie chart
- Click on segments to drill down into categories
- Expand categories to view recent transactions
- Use browser print function for PDF export

## Development

The application uses:
- React
- Recharts for data visualization
- Tailwind CSS for styling
- YNAB API for data

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.