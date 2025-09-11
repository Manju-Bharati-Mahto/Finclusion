import React, { useState, useEffect } from 'react';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import './App.css';
import ProfileEditPopup, { ProfileData } from './components/ProfileEditPopup';
import ExpenseHistoryAlternativeView from './components/ExpenseHistoryAlternativeView';
import MonthDetailPopup from './components/MonthDetailPopup';
import { profileAPI } from './services/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale, BarElement);

interface Transaction {
  id: number;
  name: string;
  amount: number;
  date: string;
  category: string;
  isIncoming: boolean;
  description?: string;
  displayDate?: string;
}

interface PaidReminder extends Transaction { // Or a more specific type if needed
  paidOn: string; // Date when the reminder was marked as paid
}

// Category definitions with unified configuration
const categoryConfig = {
  online: {
    color: 'rgba(59, 130, 246, 0.8)',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    )
  },
  food: {
    color: 'rgba(217, 119, 6, 0.8)',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  shopping: {
    color: 'rgba(139, 92, 246, 0.8)',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    )
  },
  medical: {
    color: 'rgba(236, 72, 153, 0.8)',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  emi: {
    color: 'rgba(124, 58, 237, 0.8)',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  expense: {
    color: 'rgba(239, 68, 68, 0.8)',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  income: {
    color: 'rgba(16, 185, 129, 0.8)',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )
  },
  investment: {
    color: 'rgba(245, 158, 11, 0.8)',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  fun: {
    color: 'rgba(245, 158, 11, 0.8)',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  savings: {
    color: 'rgba(14, 165, 233, 0.8)',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )
  },
  default: {
    color: 'rgba(107, 114, 128, 0.8)',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )
  }
};

// Helper functions to access category data
const getCategoryColor = (category: string, customCats: {name: string, color: string}[] = []): string => {
  const lowerCategory = category.toLowerCase();
  // First check custom categories
  const customCategory = customCats.find(c => c.name === lowerCategory);
  if (customCategory) {
    return customCategory.color;
  }
  // Then check predefined categories
  return categoryConfig[lowerCategory as keyof typeof categoryConfig]?.color || categoryConfig.default.color;
};

const getCategoryIcon = (category: string, customCats: {name: string, color: string}[] = []) => {
  const lowerCategory = category.toLowerCase();
  // First check if it's a custom category
  const customCategory = customCats.find(c => c.name === lowerCategory);
  if (customCategory) {
    // Return a default icon for custom categories
    return (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    );
  }
  // Then check predefined categories
  return categoryConfig[lowerCategory as keyof typeof categoryConfig]?.icon || categoryConfig.default.icon;
};

// Helper to format transaction date for display
// const formatTransactionDate = (dateString: string): string => {
//   const date = new Date(dateString);
//   const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//   return `${date.getDate()} ${shortMonths[date.getMonth()]}`;
// };

/* API Response Type Definition */
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Define default initial states
const DEFAULT_TRANSACTIONS: Transaction[] = [
  { id: 1, name: "Manju Bharati Ma", amount: 329, date: "2024-03-20T10:30:00Z", displayDate: "20 Feb", category: "expense", isIncoming: false, description: "Payment" },
  { id: 2, name: "Mpokket", amount: 441, date: "2024-03-19T14:20:00Z", displayDate: "19 Feb", category: "online", isIncoming: false, description: "App purchase" },
  { id: 3, name: "Simpl", amount: 196, date: "2024-03-18T09:15:00Z", displayDate: "18 Feb", category: "online", isIncoming: false, description: "Subscription" },
  { id: 4, name: "Lal Singh", amount: 48, date: "2024-03-15T12:45:00Z", displayDate: "15 Feb", category: "food", isIncoming: false, description: "Food" },
  { id: 5, name: "Khushveer Singh", amount: 48, date: "2024-03-10T16:30:00Z", displayDate: "10 Feb", category: "income", isIncoming: true, description: "Repayment" },
  { id: 6, name: "Care Pharmacy", amount: 150, date: "2024-03-08T11:20:00Z", displayDate: "08 Feb", category: "medical", isIncoming: false, description: "Medicines" }
];
const DEFAULT_CUSTOM_CATEGORIES: {name: string, color: string}[] = [];
const DEFAULT_REMINDERS: {id: number, title: string, description: string, date: string, color: string, amount: number}[] = [];
const DEFAULT_MONTHLY_BUDGET = 200;
const DEFAULT_CART_ITEMS: {id: number, title: string, price: number}[] = [];
const DEFAULT_PAID_HISTORY: PaidReminder[] = [];
const DEFAULT_PROFILE_DATA: ProfileData = { name: '', email: '', profileImage: null, dateOfBirth: '', panId: '' };

function App() {
  const [isDarkMode] = useState(true);
  
  // State for expense popups
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMonthDetailsOpen, setIsMonthDetailsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<{month: string, total: number, index: number} | null>(null);
  
  // Load transactions from localStorage or use defaults
  // Transactions are saved and retrieved from localStorage to persist between sessions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const isNewRegistration = sessionStorage.getItem('newUserRegistration') === 'true';
    if (isNewRegistration) {
      console.log("useState transactions: New user registration, using defaults.");
      return DEFAULT_TRANSACTIONS;
    }
    const savedTransactions = localStorage.getItem('transactions');
    console.log("useState transactions: Existing user/no new registration. localStorage:", savedTransactions ? "Data" : "null");
    return savedTransactions ? JSON.parse(savedTransactions) : DEFAULT_TRANSACTIONS;
  });
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    description: '',
    type: 'expense'
  });
  
  // Load budget settings from localStorage or use defaults
  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => {
    const isNewRegistration = sessionStorage.getItem('newUserRegistration') === 'true';
    if (isNewRegistration) {
      console.log("useState monthlyBudget: New user registration, using default.");
      return DEFAULT_MONTHLY_BUDGET;
    }
    const savedBudget = localStorage.getItem('monthlyBudget');
    console.log("useState monthlyBudget: Existing user/no new registration. localStorage:", savedBudget ? "Data" : "null");
    return savedBudget ? parseInt(savedBudget) : DEFAULT_MONTHLY_BUDGET;
  });
  
  const [isEditingBudget, setIsEditingBudget] = useState<boolean>(false);
  const [budgetInput, setBudgetInput] = useState<string>(() => {
    const savedBudget = localStorage.getItem('monthlyBudget');
    return savedBudget || "200";
  });
  
  // Removed unused buttonColor state
  
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  // Load cart items from localStorage or use defaults
  const [cartItems, setCartItems] = useState<{id: number, title: string, price: number}[]>(() => {
    const isNewRegistration = sessionStorage.getItem('newUserRegistration') === 'true';
    if (isNewRegistration) {
      console.log("useState cartItems: New user registration, using defaults.");
      return DEFAULT_CART_ITEMS;
    }
    const savedCartItems = localStorage.getItem('cartItems');
    console.log("useState cartItems: Existing user/no new registration. localStorage:", savedCartItems ? "Data" : "null");
    return savedCartItems ? JSON.parse(savedCartItems) : DEFAULT_CART_ITEMS;
  });
  
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    color: 'rgba(107, 114, 128, 0.8)'
  });
  
  // Load custom categories from localStorage or use defaults
  // Custom categories are saved and retrieved from localStorage to persist between sessions
  const [customCategories, setCustomCategories] = useState<{name: string, color: string}[]>(() => {
    const isNewRegistration = sessionStorage.getItem('newUserRegistration') === 'true';
    if (isNewRegistration) {
      console.log("useState customCategories: New user registration, using defaults.");
      return DEFAULT_CUSTOM_CATEGORIES;
    }
    const savedCategories = localStorage.getItem('customCategories');
    console.log("useState customCategories: Existing user/no new registration. localStorage:", savedCategories ? "Data" : "null");
    return savedCategories ? JSON.parse(savedCategories) : DEFAULT_CUSTOM_CATEGORIES;
  });
  
  // Load reminders from localStorage or use defaults
  const [reminders, setReminders] = useState<{id: number, title: string, description: string, date: string, color: string, amount: number}[]>(() => {
    const isNewRegistration = sessionStorage.getItem('newUserRegistration') === 'true';
    if (isNewRegistration) {
      console.log("useState reminders: New user registration, using defaults.");
      return DEFAULT_REMINDERS;
    }
    const savedReminders = localStorage.getItem('reminders');
    console.log("useState reminders: Existing user/no new registration. localStorage:", savedReminders ? "Data" : "null");
    return savedReminders ? JSON.parse(savedReminders) : DEFAULT_REMINDERS;
  });

  const [paidRemindersHistory, setPaidRemindersHistory] = useState<PaidReminder[]>(() => {
    const isNewRegistration = sessionStorage.getItem('newUserRegistration') === 'true';
    if (isNewRegistration) {
      console.log("useState paidRemindersHistory: New user registration, using defaults.");
      return DEFAULT_PAID_HISTORY;
    }
    const savedPaidHistory = localStorage.getItem('paidRemindersHistory');
    console.log("useState paidRemindersHistory: Existing user/no new registration. localStorage:", savedPaidHistory ? "Data" : "null");
    return savedPaidHistory ? JSON.parse(savedPaidHistory) : DEFAULT_PAID_HISTORY;
  });
  
  const [isReminderFormOpen, setIsReminderFormOpen] = useState(false);
  const [isEditingReminder, setIsEditingReminder] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<number | null>(null);
  const [reminderFormData, setReminderFormData] = useState({
    title: '',
    description: '',
    date: '',
    month: '',
    year: '',
    color: '#00BF63',
    amount: ''
  });

  const [isPaidHistoryModalOpen, setIsPaidHistoryModalOpen] = useState(false);
  
  // Available courses
  const availableCourses = [
    { id: 1, title: "Introduction to Personal Finance", description: "Learn the basics of budgeting, saving, and investing", price: 599 },
    { id: 2, title: "Investment Strategies for Beginners", description: "Understanding stocks, bonds, and mutual funds", price: 799 },
    { id: 3, title: "Retirement Planning Essentials", description: "Plan for a secure and comfortable retirement", price: 899 },
    { id: 4, title: "Debt Management & Credit Building", description: "Eliminate debt and improve your credit score", price: 699 },
    { id: 5, title: "Tax Optimization Strategies", description: "Legally minimize your tax burden", price: 999 },
  ];

  // Process transaction data for the pie chart
  const processChartData = () => {
    const categoryAmounts: Record<string, number> = {};

    // Count transactions by category and sum amounts
    transactions.forEach(transaction => {
      const category = transaction.category.toLowerCase();
      if (!categoryAmounts[category]) {
        categoryAmounts[category] = 0;
      }
      categoryAmounts[category] += transaction.amount;
    });

    const labels = Object.keys(categoryAmounts);
    const data = Object.values(categoryAmounts);
    const backgroundColor = labels.map(label => getCategoryColor(label, customCategories));

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderColor: backgroundColor.map(color => color.replace('0.8', '1')),
          borderWidth: 1,
        },
      ],
    };
  };

  // Get current month and year for chart title
  const getCurrentMonthYear = () => {
    const date = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#ffffff',
          font: {
            size: 12,
            family: "'League Spartan', sans-serif"
          }
        }
      },
      title: {
        display: true,
        text: getCurrentMonthYear(),
        color: '#ffffff',
        font: {
          size: 20,
          family: "'League Spartan', sans-serif",
          weight: 'bold' as const
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== undefined) {
              label += '₹' + context.parsed;
            }
            return label;
          }
        }
      }
    }
  };

  // Get previous months with short names
  const getPreviousMonths = () => {
    const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const date = new Date();
    const currentMonth = date.getMonth();
    
    // Return 6 months for the full history view
    return [
      shortMonths[(currentMonth - 6 + 12) % 12],
      shortMonths[(currentMonth - 5 + 12) % 12],
      shortMonths[(currentMonth - 4 + 12) % 12],
      shortMonths[(currentMonth - 3 + 12) % 12],
      shortMonths[(currentMonth - 2 + 12) % 12],
      shortMonths[(currentMonth - 1 + 12) % 12]
    ];
  };

  // Format amount to k format (e.g., 15240 -> "15.2k")
  const formatAmount = (amount: number): string => {
    if (amount >= 100000) {
      return `${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}k`;
    } else {
      return amount.toString();
    }
  };

  // Get mock data for previous months spending
  const getMonthlySpending = (getAll: boolean = false) => {
    const shortMonths = getPreviousMonths();
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Helper to get start/end of month
    const getMonthBounds = (monthsAgo: number) => {
      const targetDate = new Date();
      targetDate.setMonth(currentMonth - monthsAgo);
      
      const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      
      return { startDate, endDate };
    };
    
    // Calculate monthly totals based on transaction date
    const calculateMonthlyTotal = (monthsAgo: number) => {
      // For the demo, we're using hardcoded values for previous months
      if (monthsAgo > 0) {
        // These are fixed historic amounts that won't change when new transactions are added
        const baseAmounts = [720, 850, 930, 800, 950, 1100]; // 6 months of data
        return baseAmounts[6 - monthsAgo];
      }
      
      // For current month, calculate from transactions
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { startDate, endDate } = getMonthBounds(0);
      
      // Only count transactions in the current month for the current month's total
      return transactions.reduce((total, t) => {
        const transactionDate = new Date(t.date);
        // Check if the transaction belongs to current month
        if (transactionDate.getMonth() === currentMonth && 
            transactionDate.getFullYear() === currentYear) {
          return total + (t.isIncoming ? 0 : t.amount);
        }
        return total;
      }, 0);
    };
    
    // Generate data for the last 6 months
    const allMonthsData = [
      { month: shortMonths[0], total: calculateMonthlyTotal(6) }, // 6 months ago
      { month: shortMonths[1], total: calculateMonthlyTotal(5) }, // 5 months ago
      { month: shortMonths[2], total: calculateMonthlyTotal(4) }, // 4 months ago
      { month: shortMonths[3], total: calculateMonthlyTotal(3) }, // 3 months ago
      { month: shortMonths[4], total: calculateMonthlyTotal(2) }, // 2 months ago
      { month: shortMonths[5], total: calculateMonthlyTotal(1) }  // 1 month ago
    ];
    
    // Return all 6 months or just the last 3 months based on the getAll parameter
    return getAll ? allMonthsData : allMonthsData.slice(3, 6);
  };

  interface CategoryItem {
    category: string;
    value: number;
    color: string;
  }

  // Get category spending for mini charts - use actual pie chart data proportions
  const getCategorySpending = (monthIndex: number): CategoryItem[] => {
    // For previous months, we'll use fixed historical data but with predefined categories
    // In a real app, this would come from a database with historical records
    
    // Use the predefined categories from the system - using exact colors from the category screen
    const predefinedCategories = [
      { name: 'Food', color: '#FF7D7D' },
      { name: 'Shopping', color: '#8B5CF6' },
      { name: 'Fun', color: '#F59E0B' },
      { name: 'Transport', color: '#10B981' },
      { name: 'Utilities', color: '#3B82F6' },
      { name: 'Medical', color: '#EC4899' },
      { name: 'Education', color: '#06B6D4' },
      { name: 'Income', color: '#00BF63' }
    ];
    
    // Create historical data using the predefined categories
    const historicalMonthlyData = [
      // 6 months ago (Index 0 in history view)
      [
        { category: 'Food', value: 25, color: '#FF7D7D' },
        { category: 'Shopping', value: 15, color: '#8B5CF6' },
        { category: 'Fun', value: 20, color: '#F59E0B' },
        { category: 'Transport', value: 15, color: '#10B981' },
        { category: 'Utilities', value: 10, color: '#3B82F6' },
        { category: 'Medical', value: 5, color: '#EC4899' },
        { category: 'Education', value: 5, color: '#06B6D4' },
        { category: 'Income', value: 5, color: '#00BF63' }
      ],
      // 5 months ago (Index 1 in history view)
      [
        { category: 'Food', value: 22, color: '#FF7D7D' },
        { category: 'Shopping', value: 18, color: '#8B5CF6' },
        { category: 'Fun', value: 15, color: '#F59E0B' },
        { category: 'Transport', value: 12, color: '#10B981' },
        { category: 'Utilities', value: 15, color: '#3B82F6' },
        { category: 'Medical', value: 8, color: '#EC4899' },
        { category: 'Education', value: 5, color: '#06B6D4' },
        { category: 'Income', value: 5, color: '#00BF63' }
      ],
      // 4 months ago (Index 2 in history view)
      [
        { category: 'Food', value: 20, color: '#FF7D7D' },
        { category: 'Shopping', value: 22, color: '#8B5CF6' },
        { category: 'Fun', value: 18, color: '#F59E0B' },
        { category: 'Transport', value: 10, color: '#10B981' },
        { category: 'Utilities', value: 12, color: '#3B82F6' },
        { category: 'Medical', value: 5, color: '#EC4899' },
        { category: 'Education', value: 8, color: '#06B6D4' },
        { category: 'Income', value: 5, color: '#00BF63' }
      ],
      // 3 months ago (Index 3 in history view, Index 0 in display)
      [
        { category: 'Food', value: 20, color: '#FF7D7D' },
        { category: 'Shopping', value: 15, color: '#8B5CF6' },
        { category: 'Fun', value: 20, color: '#F59E0B' },
        { category: 'Transport', value: 15, color: '#10B981' },
        { category: 'Utilities', value: 10, color: '#3B82F6' },
        { category: 'Medical', value: 10, color: '#EC4899' },
        { category: 'Education', value: 5, color: '#06B6D4' },
        { category: 'Income', value: 5, color: '#00BF63' }
      ],
      // 2 months ago (Index 4 in history view, Index 1 in display)
      [
        { category: 'Food', value: 30, color: '#FF7D7D' },
        { category: 'Shopping', value: 15, color: '#8B5CF6' },
        { category: 'Fun', value: 10, color: '#F59E0B' },
        { category: 'Transport', value: 15, color: '#10B981' },
        { category: 'Utilities', value: 10, color: '#3B82F6' },
        { category: 'Medical', value: 5, color: '#EC4899' },
        { category: 'Education', value: 10, color: '#06B6D4' },
        { category: 'Income', value: 5, color: '#00BF63' }
      ],
      // 1 month ago (Index 5 in history view, Index 2 in display)
      [
        { category: 'Food', value: 25, color: '#FF7D7D' },
        { category: 'Shopping', value: 20, color: '#8B5CF6' },
        { category: 'Fun', value: 15, color: '#F59E0B' },
        { category: 'Transport', value: 10, color: '#10B981' },
        { category: 'Utilities', value: 10, color: '#3B82F6' },
        { category: 'Medical', value: 10, color: '#EC4899' },
        { category: 'Education', value: 5, color: '#06B6D4' },
        { category: 'Income', value: 5, color: '#00BF63' }
      ]
    ];
    
    // For previous months, return fixed historical data
    if (monthIndex < 6) {
      return historicalMonthlyData[monthIndex];
    }
    
    // For the current month (not displayed in UI in this version), calculate from transactions
    // This is included for future expansion - currently not displayed
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Filter transactions for current month only
    const currentMonthTransactions = transactions.filter(t => {
      const transDate = new Date(t.date);
      return transDate.getMonth() === currentMonth && 
             transDate.getFullYear() === currentYear;
    });
    
    // Map transactions to predefined categories or assign to closest match
    const categoryTotals: { [key: string]: number } = {
      'Food': 0,
      'Shopping': 0,
      'Fun': 0,
      'Transport': 0,
      'Utilities': 0,
      'Medical': 0,
      'Education': 0,
      'Income': 0
    };
    
    // Helper function to map transaction categories to predefined ones
    const mapToNearestCategory = (category: string): string => {
      category = category.toLowerCase();
      
      // Direct mappings
      if (category === 'food') return 'Food';
      if (category === 'shopping' || category === 'online') return 'Shopping';
      if (category === 'emi' || category === 'expense') return 'Utilities';
      if (category === 'medical') return 'Medical';
      if (category === 'income') return 'Income';
      if (category === 'savings' || category === 'investment') return 'Utilities';
      if (category === 'entertainment') return 'Fun';
      
      // Default to Fun if no match
      return 'Fun';
    };
    
    // Sum up transactions by category
    currentMonthTransactions.forEach(t => {
      const mappedCategory = mapToNearestCategory(t.category);
      categoryTotals[mappedCategory] += t.amount;
    });
    
    // Calculate total spending
    const totalSpending = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
    
    // Convert to percentages and format for chart
    const result: CategoryItem[] = [];
    
    predefinedCategories.forEach(cat => {
      const amount = categoryTotals[cat.name] || 0;
      const percentage = totalSpending > 0 ? Math.round((amount / totalSpending) * 100) : 0;
      
      // Only include categories with values > 0
      if (percentage > 0) {
        result.push({
          category: cat.name,
          value: percentage,
          color: cat.color
        });
      }
    });
    
    // Return data, sorted by value (highest first)
    return result.sort((a, b) => b.value - a.value);
  };

  // Check if we need to update monthly data (would be triggered at start of new month)
  useEffect(() => {
    // In a real app, this would check if the current date is the 1st of the month
    // and then update the monthly spending data accordingly
    
    // For simulation purposes, we'll just check on component mount
    const today = new Date();
    const isFirstDayOfMonth = today.getDate() === 1;
    
    if (isFirstDayOfMonth) {
      // This would typically fetch or calculate the new data for the previous month
      console.log("New month started, updating monthly spending data");
      // getMonthlySpending() would be called again or data would be refreshed
    }
    
    // Set up a check for the next day (in real app would use more sophisticated scheduling)
    const checkForMonthChange = () => {
      const now = new Date();
      if (now.getDate() === 1 && now.getHours() === 0 && now.getMinutes() === 0) {
        // Update monthly data
        console.log("Month changed, updating data");
      }
    };
    
    // Check every hour if it's a new month (simplified for demo)
    const intervalId = setInterval(checkForMonthChange, 3600000); // 1 hour
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Apply dark theme class to document body
    document.body.className = 'dark-theme';
    document.body.style.backgroundColor = '#000000';
  }, []);

  const handleAddItem = () => {
    setIsFormOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setIsEditMode(true);
    setEditingTransactionId(transaction.id);
    setFormData({
      name: transaction.name,
      category: transaction.category || 'expense',
      amount: transaction.amount.toString(),
      description: transaction.description || '',
      type: transaction.isIncoming ? 'income' : 'expense'
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setIsEditMode(false);
    setEditingTransactionId(null);
    setFormData({
      name: '',
      category: '',
      amount: '',
      description: '',
      type: 'expense'
    });
  };

  const handleDeleteTransaction = (id: number) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim() || !formData.amount || !formData.category) {
      alert("Please fill in all required fields");
      return;
    }
    
    // Format the date properly for month filtering
    const now = new Date();
    const formattedDate = now.toISOString();
    const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const displayDate = `${now.getDate()} ${shortMonths[now.getMonth()]}`; // Current month in short format
    
    const newTransaction: Transaction = {
      id: editingTransactionId || Date.now(),
      name: formData.name.trim(),
      amount: parseFloat(formData.amount),
      category: formData.category.toLowerCase(),
      description: formData.description.trim(),
      isIncoming: formData.type === 'income',
      date: formattedDate,
      displayDate: displayDate
    };
    
    if (isEditMode && editingTransactionId) {
      // Update existing transaction
      setTransactions(transactions.map(t => 
        t.id === editingTransactionId ? newTransaction : t
      ));
      console.log("Transaction updated:", newTransaction);
    } else {
      // Add new transaction to the top of the list
      setTransactions([newTransaction, ...transactions]);
      console.log("New transaction added:", newTransaction);
    }
    
    setIsFormOpen(false);
    setFormData({
      name: '',
      amount: '',
      category: '',
      type: 'expense',
      description: ''
    });
    setIsEditMode(false);
    setEditingTransactionId(null);
    
    // Show confirmation message
    alert(`Transaction ${isEditMode ? 'updated' : 'added'} successfully`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Check if spending has exceeded budget
  const hasExceededBudget = (amount: number): boolean => {
    return amount > monthlyBudget;
  };

  // Debug budget checks
  useEffect(() => {
    const monthlyData = getMonthlySpending();
    console.log("Monthly Budget:", monthlyBudget);
    monthlyData.forEach(data => {
      console.log(`Month ${data.month}: ${data.total} > ${monthlyBudget} = ${data.total > monthlyBudget}`);
    });
  }, [monthlyBudget, getMonthlySpending]);

  // Calculate budget exceeded percentage
  const calculateBudgetExceededPercentage = (): number => {
    const totalSpent = processChartData().datasets[0].data.reduce((sum, val) => sum + val, 0);
    if (totalSpent <= monthlyBudget) return 0;
    return Math.round(((totalSpent - monthlyBudget) / monthlyBudget) * 100);
  };

  const handleAddToCart = (course: {id: number, title: string, price: number}) => {
    // Check if course is already in cart
    if (!cartItems.some(item => item.id === course.id)) {
      setCartItems([...cartItems, course]);
    }
  };

  const handleRemoveFromCart = (courseId: number) => {
    setCartItems(cartItems.filter(item => item.id !== courseId));
  };

  const getTotalCartValue = () => {
    return cartItems.reduce((total, item) => total + item.price, 0);
  };

  // Reminder handlers
  const handleAddReminder = () => {
    setIsReminderFormOpen(true);
    setIsEditingReminder(false);
    setEditingReminderId(null);
    setReminderFormData({
      title: '',
      description: '',
      date: '',
      month: '',
      year: '',
      color: '#00BF63',
      amount: ''
    });
  };

  // Check if a reminder date is approaching (within 5 days)
  const isDateApproaching = (reminderDate: string): boolean => {
    try {
      const months = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      const dateParts = reminderDate.split(' ');
      if (dateParts.length < 2) return false;
      
      const day = parseInt(dateParts[0]);
      const month = dateParts[1];
      const year = dateParts.length > 2 ? parseInt(dateParts[2]) : new Date().getFullYear();
      
      if (isNaN(day) || !months.hasOwnProperty(month) || isNaN(year)) return false;
      
      const reminderDateObj = new Date(year, months[month as keyof typeof months], day);
      const currentDate = new Date();
      
      // Reset hours, minutes, seconds, and milliseconds for accurate day comparison
      reminderDateObj.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);
      
      // Calculate the difference in milliseconds and convert to days
      const differenceInTime = reminderDateObj.getTime() - currentDate.getTime();
      const differenceInDays = differenceInTime / (1000 * 3600 * 24);
      
      // Return true if the difference is between 0 and 5 days (inclusive)
      return differenceInDays >= 0 && differenceInDays <= 5;
    } catch (error) {
      console.error("Error checking date:", error);
      return false;
    }
  };

  const handleEditReminder = (reminder: {id: number, title: string, description: string, date: string, color: string, amount: number}) => {
    setIsEditingReminder(true);
    setEditingReminderId(reminder.id);
    
    // Parse the date into components
    const dateParts = reminder.date.split(' ');
    
    // Ensure we're setting the state properly
    setReminderFormData({
      title: reminder.title,
      description: reminder.description,
      date: dateParts[0] || '',
      month: dateParts[1] || '',
      year: dateParts.length > 2 ? dateParts[2] : '',
      color: reminder.color,
      amount: reminder.amount ? reminder.amount.toString() : ''
    });
    
    console.log("Editing reminder:", reminder);
    console.log("Form data set to:", {
      title: reminder.title,
      description: reminder.description,
      date: dateParts[0] || '',
      month: dateParts[1] || '',
      year: dateParts.length > 2 ? dateParts[2] : '',
      color: reminder.color,
      amount: reminder.amount ? reminder.amount.toString() : ''
    });
    
    setIsReminderFormOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteReminder = (id: number) => {
    // Simple direct deletion
    setReminders(currentReminders => currentReminders.filter(r => r.id !== id));
  };

  const handleReminderFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReminderFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if we've reached the maximum number of reminders (20)
    if (!isEditingReminder && reminders.length >= 20) {
      alert("You can add a maximum of 20 reminders. Please delete some to add more.");
      return;
    }
    
    // Format the date
    const formattedDate = `${reminderFormData.date} ${reminderFormData.month}${reminderFormData.year ? ' ' + reminderFormData.year : ''}`;
    
    const newReminder = {
      id: isEditingReminder && editingReminderId ? editingReminderId : Date.now(),
      title: reminderFormData.title,
      description: reminderFormData.description,
      date: formattedDate,
      color: reminderFormData.color,
      amount: reminderFormData.amount ? parseFloat(reminderFormData.amount) : 0
    };
    
    if (isEditingReminder && editingReminderId) {
      setReminders(reminders.map(reminder => 
        reminder.id === editingReminderId ? newReminder : reminder
      ));
    } else {
      // Add new reminders to the top of the list
      setReminders([newReminder, ...reminders]);
    }
    
    setIsReminderFormOpen(false);
  };

  const handleAddCategory = () => {
    setIsCategoryFormOpen(true);
  };

  const handleCategoryFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCategoryFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate category name isn't empty and doesn't already exist
    const categoryName = categoryFormData.name.toLowerCase().trim();
    if (!categoryName) {
      alert("Category name cannot be empty");
      return;
    }
    
    // Check if category already exists in predefined categories
    if (Object.keys(categoryConfig).includes(categoryName)) {
      alert(`Category "${categoryName}" already exists as a predefined category`);
      return;
    }
    
    // Check if category already exists in custom categories
    if (customCategories.some(cat => cat.name === categoryName)) {
      alert(`Category "${categoryName}" already exists as a custom category`);
      return;
    }
    
    const newCategory = {
      name: categoryName,
      color: categoryFormData.color
    };
    
    // Add new category to custom categories list
    setCustomCategories([...customCategories, newCategory]);
    setIsCategoryFormOpen(false);
    setCategoryFormData({
      name: '',
      color: 'rgba(107, 114, 128, 0.8)'
    });
    
    // Show confirmation message
    alert(`New category "${categoryName}" has been added and will be available in the category dropdown`);
  };

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    // Persist transactions to localStorage
    // This ensures transactions are saved across page refreshes and browser restarts
    localStorage.setItem('transactions', JSON.stringify(transactions));
    console.log("Transactions saved:", transactions);
  }, [transactions]);
  
  // Save custom categories to localStorage whenever they change
  useEffect(() => {
    // Persist custom categories to localStorage
    // This ensures categories are saved across page refreshes and browser restarts
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
    console.log("Custom categories saved:", customCategories);
  }, [customCategories]);
  
  // Save reminders to localStorage whenever they change
  useEffect(() => {
    // Persist reminders to localStorage
    localStorage.setItem('reminders', JSON.stringify(reminders));
  }, [reminders]);
  
  // Save monthly budget to localStorage whenever it changes
  useEffect(() => {
    // Persist monthly budget to localStorage
    localStorage.setItem('monthlyBudget', monthlyBudget.toString());
  }, [monthlyBudget]);
  
  // Save cart items to localStorage whenever they change
  useEffect(() => {
    // Persist cart items to localStorage
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeMonth, setActiveMonth] = useState<number>(0);

  // Function to remove a specific category by name
  const removeCategory = (categoryName: string) => {
    const lowerCaseName = categoryName.toLowerCase();
    const categoryExists = customCategories.some(cat => cat.name.toLowerCase() === lowerCaseName);
    
    if (categoryExists) {
      setCustomCategories(customCategories.filter(cat => cat.name.toLowerCase() !== lowerCaseName));
      console.log(`Category '${categoryName}' has been removed`);
      // Only show alert for successful removal
      alert(`Category '${categoryName}' has been successfully removed`);
    } else {
      // Just log to console, don't show alert
      console.log(`Category '${categoryName}' does not exist in custom categories`);
    }
  };
  
  // Remove H&M category if it exists
  useEffect(() => {
    removeCategory('H&M');
    // This effect runs only once on component mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add these new state hooks in the App component function
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<ProfileData>(() => {
    const isNewRegistration = sessionStorage.getItem('newUserRegistration') === 'true';
    if (isNewRegistration) {
      const registeredName = sessionStorage.getItem('registeredName');
      console.log("useState profileData: New user registration. Initializing with name:", registeredName);
      return {
        name: registeredName || '',
        email: '', // Will be explicitly set/cleared in useEffect or ProfileEditPopup
        profileImage: null,
        dateOfBirth: '',
        panId: ''
      };
    }
    const savedProfile = localStorage.getItem('userProfile');
    console.log("useState profileData: Existing user/no new registration. localStorage (userProfile):", savedProfile ? "Data" : "null");
    return savedProfile ? JSON.parse(savedProfile) : DEFAULT_PROFILE_DATA;
  });

  // Load profile data from API when the app loads
  useEffect(() => {
    const newUserRegistered = sessionStorage.getItem('newUserRegistration') === 'true';
    const registeredNameFromSession = sessionStorage.getItem('registeredName');
    const currentUserToken = localStorage.getItem('token'); // More reliable check for "logged in"

    console.log("App.tsx useEffect: newUserRegistered:", newUserRegistered, "currentUserToken:", !!currentUserToken);

    if (newUserRegistered && registeredNameFromSession) {
      console.log("App.tsx useEffect: New user registration detected. Setting up profile popup.");
      // ProfileData is already initialized by its useState with the registeredName.
      // Other states (transactions, reminders, etc.) are also initialized to defaults by their useStates.
      setIsNewUser(true);
      setIsProfileOpen(true); // Open profile completion popup

      // Clear session storage flags now that they've been processed
      sessionStorage.removeItem('newUserRegistration');
      sessionStorage.removeItem('registeredName');
    } else if (currentUserToken) {
      console.log("App.tsx useEffect: Existing logged-in user. Loading profile from API.");
      loadProfileFromAPI();
      // Other data (transactions, etc.) should have been loaded from localStorage by their useStates.
    } else {
      console.log("App.tsx useEffect: No active user session. States should be defaults.");
      // All states should already be their defaults from their useState initializers
      // because localStorage items relevant to a user session would be null.
      setIsNewUser(false); // Ensure this is false if no user is logged in
      setProfileData(DEFAULT_PROFILE_DATA); // Explicitly reset profile if no user
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Runs once on App mount/re-mount

  const loadProfileFromAPI = async () => {
    try {
      // Use a more specific type cast to handle the API response
      const response = await profileAPI.getProfile() as unknown as ApiResponse<ProfileData>;
      
      if (response && response.success && response.data) {
        setProfileData(response.data);
        // If profile data is empty, user may be registered but not completed profile
        if (!response.data.name) {
          setIsNewUser(true);
          setIsProfileOpen(true);
        }
        return response.data;
      } else {
        // Fallback to localStorage if API has an error
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
          const parsedProfile = JSON.parse(storedProfile);
          setProfileData(parsedProfile);
          return parsedProfile;
        } else {
          setIsNewUser(true);
          setIsProfileOpen(true);
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading profile:', error);
      return null;
    }
  };

  const handleProfileSave = async (updatedProfileData: ProfileData) => {
    console.log('handleProfileSave called with data:', updatedProfileData);
    
    try {
      // Use a more specific type cast to handle the API response
      const response = await profileAPI.updateProfile(updatedProfileData) as unknown as ApiResponse<ProfileData>;
      console.log('API response:', response);
      
      if (response && response.success && response.data) {
        // Update the state
        setProfileData(response.data);
        
        // Always close the popup and mark user as not new
        setIsProfileOpen(false);
        setIsNewUser(false);
        
        // Show success message
        toast.success('Profile updated successfully!');
        
        // Reload profile data to ensure everything is consistent
        loadProfileFromAPI();
        
        return true;
      } else {
        // Log the error but try to continue with local data
        console.error('API error:', response?.error);
        
        // If API failed, use the provided data anyway
        setProfileData(updatedProfileData);
        setIsProfileOpen(false);
        setIsNewUser(false);
        
        toast.success('Profile saved successfully!');
        return true; // Return true to indicate success to component
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      
      // Even if API fails, use the provided data
      setProfileData(updatedProfileData);
      setIsProfileOpen(false);
      setIsNewUser(false);
      
      toast.success('Profile saved successfully!');
      return true; // Return true to indicate success to component
    }
  };

  // Add simulated registration handler
  const handleRegistrationSubmit = () => {
    // Set registration flag in session storage
    sessionStorage.setItem('fromRegistration', 'true');
    
    // Close registration form
    setIsRegistering(false);
    
    // Simulate redirect by showing profile popup with slight delay
    setTimeout(() => {
      setIsNewUser(true);
      setIsProfileOpen(true);
    }, 300);
  };

  const handleMarkAsPaid = (reminderToPay: {id: number, title: string, description: string, date: string, color: string, amount: number}) => {
    const now = new Date();
    const paidOnDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'}); // e.g., 15 Jul 2024

    // Create a new object for the paid history, including the 'paidOn' date
    // Assuming reminderToPay has all necessary fields similar to Transaction or a custom type
    const paidReminderEntry: PaidReminder = {
      ...reminderToPay,
      // Map reminder fields to Transaction fields if necessary, or adjust PaidReminder interface
      // For simplicity, assuming direct spread works and reminderToPay has 'name', 'category', 'isIncoming' etc.
      // If not, you'll need to map:
      name: reminderToPay.title, 
      category: 'reminder', // Or derive if reminders have categories
      isIncoming: false, // Paid reminders are expenses/outflows
      // displayDate: reminderToPay.date, // original due date is already reminderToPay.date
      paidOn: paidOnDate,
    };

    setPaidRemindersHistory(prevHistory => [paidReminderEntry, ...prevHistory]);
    setReminders(currentReminders => currentReminders.filter(r => r.id !== reminderToPay.id));
    toast.success(`Reminder "${reminderToPay.title}" marked as paid and moved to history.`);
  };

  // Save paid reminders history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('paidRemindersHistory', JSON.stringify(paidRemindersHistory));
  }, [paidRemindersHistory]);

  return (
    <div className="min-h-screen flex flex-col dark-theme bg-[#000000]">
      <Header 
        isDarkMode={isDarkMode} 
        profileData={profileData} 
        onEditProfile={() => setIsProfileOpen(true)}
        onSignUp={() => setIsRegistering(true)} 
        onBrowseCoursesClick={() => setIsCourseModalOpen(true)}
      />
      <main className="flex-grow p-4 h-[calc(100vh-120px)] bg-[#000000]">
        {/* Top Section */}
        <div className="h-[calc(100vh-136px)]">
          <div className="flex gap-4 h-full">
            {/* Left Section with width increased by 2.5% */}
            <div className="left-section-adjusted flex flex-col gap-4 h-full">
              {/* Upper part (15%) */}
              <div className={`flex-shrink-0 rounded-lg p-4 pitch-black-card h-[18%]`}>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col space-y-1">
                    <h2 className="text-2xl font-bold text-[#00BF63]">
                      {profileData.name ? profileData.name : 'Welcome User'}
                    </h2>
                    {profileData.dateOfBirth && (
                      <p className="text-sm text-white">DOB: {new Date(profileData.dateOfBirth).toLocaleDateString()}</p>
                    )}
                    {profileData.panId && (
                      <p className="text-sm text-white font-bold">PAN ID: <span className="text-[#00BF63]">{profileData.panId}</span></p>
                    )}
                  </div>
                  <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-[#00BF63] bg-[#0a0a0a] flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                    {profileData.profileImage ? (
                      <img 
                        src={profileData.profileImage} 
                        alt={profileData.name || "User"} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-12 h-12 text-gray-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
              {/* Lower part (85%) */}
              <div className={`flex-grow rounded-lg p-0 bg-[#0a0a0a] transaction-list-container-wrapper`} style={{ height: "calc(80% - 2rem)" }}>
                <div className="flex justify-between items-center p-4">
                  <h2 className="text-2xl font-bold text-white">Recent Transactions</h2>
                  <button 
                    onClick={handleAddItem}
                    className="add-button"
                  >
                    <span className="text-xl mr-1">Add</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                <div className="h-[calc(100%-4rem)] overflow-y-auto custom-scrollbar">
                  <div>
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="transaction-item">
                        <div className="flex items-center gap-2">
                          <div className="category-icon">
                            {getCategoryIcon(transaction.category, customCategories)}
                          </div>
                          <div className="transaction-info">
                            <div className="transaction-header">
                              <span className="transaction-name">{transaction.name}</span>
                              <span className={`category-tag tag-${transaction.category.toLowerCase()}`}>
                                {transaction.category}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="transaction-description">{transaction.description}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`transaction-amount ${transaction.isIncoming ? 'text-[#ef4444]' : 'text-[#00BF63]'}`}>
                            ₹{transaction.amount}
                          </span>
                          <button
                            onClick={() => handleEditTransaction(transaction)}
                            className="edit-button"
                          >
                            <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="delete-button"
                          >
                            <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Right Section */}
            <div className="center-section-adjusted">
              <div className="upper-center">
                <div className="upper-center-left">
                  <div className="upper-left-top">
                    <div className="flex justify-between items-center mb-3 px-2">
                      <h2 className="text-lg font-bold text-white">Expenses</h2>
                      <button
                        onClick={() => setIsHistoryOpen(true)}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs p-1.5 rounded border border-red-700 flex items-center justify-center transition-colors duration-150"
                        aria-label="Show expense history"
                      >
                        <svg className="w-3.5 h-3.5" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 8v4l3 3"></path>
                          <path d="M21.54 15.96a9 9 0 1 1-1.32-8.02"></path>
                          <path d="M21.54 15.96L22 12"></path>
                          <path d="M17.04 19.04L21.54 15.96"></path>
                        </svg>
                      </button>
                    </div>
                    {getMonthlySpending().map((data, index) => (
                      <div 
                        key={index} 
                        className="upper-left-top-section cursor-pointer hover:bg-black/30 rounded-lg px-3 py-3 mb-2 bg-black/20 transition-colors duration-200"
                        onClick={() => {
                          setSelectedMonth({...data, index});
                          setIsMonthDetailsOpen(true);
                        }}
                      >
                        <div className="mb-0">
                          <div className="flex justify-between items-center">
                            <h2 className={`text-[2rem] leading-none font-bold font-league-spartan month-label ${hasExceededBudget(data.total) ? 'text-[#00FF00]' : 'text-white'}`}>
                              {data.month}
                            </h2>
                            <div className="flex flex-col items-end">
                              <p className="text-[1.4rem] font-bold text-[#00BF63] font-league-spartan">₹{formatAmount(data.total)}</p>
                              <div className="mini-bar-chart">
                                <div className="mini-bar-container">
                                  {getCategorySpending(index)
                                    .sort((a, b) => b.value - a.value) // Sort by value to show larger segments first
                                    .map((item, i, arr) => (
                                      <div 
                                        key={i}
                                        style={{
                                          flexGrow: item.value,
                                          backgroundColor: item.color,
                                          borderRadius: 0 /* Sharp edges for all corners */
                                        }}
                                        className="mini-bar-segment"
                                        title={`${item.category}: ${item.value}%`}
                                      />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="upper-left-bottom">
                    <h2 className="text-lg font-bold mb-2 text-white">Spending Analysis</h2>
                    <div className="flex h-[calc(100%-2rem)]">
                      <div className="chart-container">
                        <Pie 
                          data={processChartData()} 
                          options={{
                            ...chartOptions,
                            cutout: '60%', // Increased to 60%
                            maintainAspectRatio: true,
                            responsive: true,
                            plugins: {
                              ...chartOptions.plugins,
                              legend: {
                                display: false
                              }
                            }
                          }} 
                        />
                        {calculateBudgetExceededPercentage() > 0 && (
                          <div className="absolute bottom-4 left-0 w-full flex justify-start pl-4">
                            <div className="bg-[#111] border border-[#333] rounded px-2 py-1 text-xs shadow-lg text-center max-w-[90%]">
                              <span className="text-white">Budget exceeded by </span>
                              <span className="text-[#00FF00] font-bold">{calculateBudgetExceededPercentage()}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="spending-insights w-1/2 pl-4 flex flex-col justify-start overflow-hidden">
                        <div className="budget-section">
                          <h3 className="text-lg font-bold mb-2 text-white">Set Budget</h3>
                          {isEditingBudget ? (
                            <div className="budget-input-container flex flex-col space-y-2 mb-3 border border-[#333] rounded p-2 bg-[#111]">
                              <div className="flex items-center">
                                <span className="text-xs text-white mr-2">₹</span>
                                <input 
                                  type="number" 
                                  inputMode="numeric"
                                  value={budgetInput}
                                  onChange={(e) => {
                                    console.log("Budget input changed:", e.target.value);
                                    setBudgetInput(e.target.value);
                                  }}
                                  className="bg-[#222] text-white text-xs p-1 rounded w-24 flex-grow border border-[#333]"
                                  placeholder="Enter budget amount"
                                />
                              </div>
                              <button 
                                onClick={() => {
                                  const newBudget = Number(budgetInput);
                                  console.log("Setting new budget:", newBudget);
                                  setMonthlyBudget(newBudget);
                                  setIsEditingBudget(false);
                                }}
                                className="text-xs bg-[#00BF63] text-black px-2 py-1 rounded w-full"
                              >
                                Set Budget
                              </button>
                            </div>
                          ) : (
                            <div className="budget-display flex flex-col space-y-2 mb-3 border border-[#333] rounded p-2 bg-[#111]">
                              <div className="flex items-center">
                                <span className="text-white text-xs mr-1">Current Monthly Budget:</span>
                                <span className="text-[#00BF63] text-xs font-medium">₹{formatAmount(monthlyBudget)}</span>
                              </div>
                              <button
                                onClick={() => setIsEditingBudget(true)}
                                className="text-xs bg-[#333] hover:bg-[#00BF63] text-white px-2 py-1 rounded w-full"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                        <h3 className="text-lg font-bold mb-1 text-white">Insights</h3>
                        <div className="text-[#cccccc] text-xs space-y-1">
                          <p className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-[#3b82f6] mr-2"></span>
                            <span>Top category: <span className="text-white font-medium capitalize">{processChartData().labels[0]}</span></span>
                          </p>
                          <p className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-[#00BF63] mr-2"></span>
                            <span>Total spent: <span className="text-white font-medium">₹{formatAmount(processChartData().datasets[0].data.reduce((sum, val) => sum + val, 0))}</span></span>
                          </p>
                          <p className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-[#ef4444] mr-2"></span>
                            <span>Categories: <span className="text-white font-medium">{processChartData().labels.length}</span></span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="upper-center-right">
                  <div className="flex justify-between items-center p-4 pt-2">
                    <h2 className="text-lg font-bold text-white">Categories</h2>
                    <button 
                      onClick={handleAddCategory}
                      className="bg-[#222] hover:bg-[#333] text-white text-xs px-2 py-1 rounded border border-[#333] flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add Category</span>
                    </button>
                  </div>
                  <div className="h-[calc(100%-4rem)] overflow-y-auto custom-scrollbar">
                    <div>
                      {/* Categories Section */}
                      <div className="mt-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center p-2 rounded-md bg-[#111] border border-[#222]">
                            <span className="w-3 h-3 rounded-full bg-[#FF7D7D] mr-2"></span>
                            <span className="text-white text-sm capitalize">Food</span>
                          </div>
                          <div className="flex items-center p-2 rounded-md bg-[#111] border border-[#222]">
                            <span className="w-3 h-3 rounded-full bg-[#8B5CF6] mr-2"></span>
                            <span className="text-white text-sm capitalize">Shopping</span>
                          </div>
                          <div className="flex items-center p-2 rounded-md bg-[#111] border border-[#222]">
                            <span className="w-3 h-3 rounded-full bg-[#F59E0B] mr-2"></span>
                            <span className="text-white text-sm capitalize">Fun</span>
                          </div>
                          <div className="flex items-center p-2 rounded-md bg-[#111] border border-[#222]">
                            <span className="w-3 h-3 rounded-full bg-[#10B981] mr-2"></span>
                            <span className="text-white text-sm capitalize">Transport</span>
                          </div>
                          <div className="flex items-center p-2 rounded-md bg-[#111] border border-[#222]">
                            <span className="w-3 h-3 rounded-full bg-[#3B82F6] mr-2"></span>
                            <span className="text-white text-sm capitalize">Utilities</span>
                          </div>
                          <div className="flex items-center p-2 rounded-md bg-[#111] border border-[#222]">
                            <span className="w-3 h-3 rounded-full bg-[#EC4899] mr-2"></span>
                            <span className="text-white text-sm capitalize">Medical</span>
                          </div>
                          <div className="flex items-center p-2 rounded-md bg-[#111] border border-[#222]">
                            <span className="w-3 h-3 rounded-full bg-[#06B6D4] mr-2"></span>
                            <span className="text-white text-sm capitalize">Education</span>
                          </div>
                          <div className="flex items-center p-2 rounded-md bg-[#111] border border-[#222]">
                            <span className="w-3 h-3 rounded-full bg-[#00BF63] mr-2"></span>
                            <span className="text-white text-sm capitalize">Income</span>
                          </div>
                          {customCategories.map((category, index) => (
                            <div key={index} className="flex items-center p-2 rounded-md bg-[#111] border border-[#222]">
                              <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }}></span>
                              <span className="text-white text-sm capitalize">{category.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lower-center">
                <div className="flex gap-4 h-full">
                  {/* Lower Left Section */}
                  <div className="lower-left-section w-1/2 h-full bg-[#0a0a0a] rounded-lg border border-[#222] p-4 pb-2 flex flex-col">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <h2 className="text-xl font-bold text-white" style={{ fontSize: 'calc(1.25rem * 0.9)' }}>Financial Literacy Courses</h2>
                        <div className="flex justify-end mt-auto">
                          <button 
                            onClick={() => setIsCourseModalOpen(true)}
                            className="bg-[#00BF63] text-white border border-[#00BF63] px-2 py-1 rounded text-[calc(0.9rem*0.9)] font-medium"
                          >
                            Browse All Courses
                          </button>
                        </div>
                      </div>
                      <p className="text-[#aaa] text-sm mb-1" style={{ fontSize: 'calc(0.8rem * 1.1)' }}>Enhance your financial knowledge with our expert-led courses designed to help you make better financial decisions and achieve long-term wealth.</p>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-[#00BF63] mr-2"></span>
                          <span className="text-white text-sm" style={{ fontSize: 'calc(0.8rem * 1.1)' }}>Personalized learning paths</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-[#00BF63] mr-2"></span>
                          <span className="text-white text-sm" style={{ fontSize: 'calc(0.8rem * 1.1)' }}>Expert-led sessions</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-[#00BF63] mr-2"></span>
                          <span className="text-white text-sm" style={{ fontSize: 'calc(0.8rem * 1.1)' }}>Interactive workshops &amp; exercises</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-[#00BF63] mr-2"></span>
                          <span className="text-white text-sm" style={{ fontSize: 'calc(0.8rem * 1.1)' }}>Real-world case studies &amp; simulations</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Lower Right Section */}
                  <div className="lower-right-section w-1/2 h-full bg-[#0a0a0a] rounded-lg border border-[#222] p-4 pb-2">
                    <div className="flex justify-between items-center mb-1">
                      <h2 className="text-xl font-bold text-white" style={{ fontSize: 'calc(1.25rem * 0.9)' }}>Reminders</h2>
                      
                      <div className="flex items-center gap-2"> {/* Wrapper for buttons */}
                        <button 
                          onClick={handleAddReminder}
                          className="bg-[#00BF63] text-white text-xs px-2 py-1 rounded border border-[#00BF63] flex items-center gap-1"
                          style={{ fontSize: 'calc(0.7rem * 0.9)' }}
                          title={`${reminders.length}/20 reminders used`}
                          disabled={reminders.length >= 20}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Add Reminder ({reminders.length}/20)</span>
                        </button>
                        <button
                          onClick={() => setIsPaidHistoryModalOpen(true)}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded border border-red-700 flex items-center gap-1 transition-colors duration-150"
                          style={{ fontSize: 'calc(0.7rem * 0.9)' }}
                          title="View Paid Reminders History"
                        >
                          <svg className="w-3 h-3" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 8v4l3 3"></path>
                            <path d="M21.54 15.96a9 9 0 1 1-1.32-8.02"></path>
                            <path d="M21.54 15.96L22 12"></path>
                            <path d="M17.04 19.04L21.54 15.96"></path>
                          </svg>
                          <span>History</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 mt-1 overflow-y-auto reminders-scrollbar" style={{ maxHeight: 'calc(100% - 40px)' }}>
                      {reminders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[150px] text-center p-4">
                          <svg className="w-6 h-6 text-[#333] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-[#666] text-sm">No reminders yet</p>
                          <p className="text-[#444] text-xs mt-1">Click the Add Reminder button to create one</p>
                        </div>
                      ) : (
                        reminders.map(reminder => {
                          // Check if the date is approaching
                          const isApproaching = isDateApproaching(reminder.date);
                          // Calculate how many days until the reminder date
                          const daysDiff = (() => {
                            const dateParts = reminder.date.split(' ');
                            if (dateParts.length < 2) return null;
                            
                            const months = {
                              'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                              'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
                            };
                            
                            const day = parseInt(dateParts[0]);
                            const month = dateParts[1];
                            const year = dateParts.length > 2 ? parseInt(dateParts[2]) : new Date().getFullYear();
                            
                            if (isNaN(day) || !months.hasOwnProperty(month) || isNaN(year)) return null;
                            
                            const reminderDateObj = new Date(year, months[month as keyof typeof months], day);
                            const currentDate = new Date();
                            
                            reminderDateObj.setHours(0, 0, 0, 0);
                            currentDate.setHours(0, 0, 0, 0);
                            
                            const differenceInTime = reminderDateObj.getTime() - currentDate.getTime();
                            return Math.ceil(differenceInTime / (1000 * 3600 * 24));
                          })();
                          
                          // Determine if it's due today (urgent)
                          const isUrgent = daysDiff === 0;
                          
                          // Get human readable due date
                          const getDueText = () => {
                            if (daysDiff === null) return '';
                            if (daysDiff === 0) return 'Due today!';
                            if (daysDiff === 1) return 'Due tomorrow!';
                            if (daysDiff > 0 && daysDiff <= 5) return `Due in ${daysDiff} days`;
                            return '';
                          };
                          
                          const handleSendReminderEmail = () => {
                            if (!profileData.email) {
                              toast.error("User email is not available to send a reminder.");
                              return;
                            }

                            const subject = `Payment Reminder: ${reminder.title}`;
                            const body = `
Alert!!

You have an upcoming payment of ${reminder.title} on ${reminder.date}.
Please, make sure to pay it back by then to avoid Charges.

Thanks Regards,
finclusion
                            `.trim().replace(/\n/g, '%0A'); // Encode line breaks for mailto

                            const mailtoLink = `mailto:${profileData.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                            window.location.href = mailtoLink;
                          };
                          
                          return (
                            <div 
                              key={reminder.id} 
                              className="flex items-center p-1.5 rounded-md bg-[#111] border border-[#222] cursor-pointer reminder-item"
                              // onClick is already used for handleEditReminder, so the email button will be separate
                              // No direct hover utility classes were on this main div, assuming .reminder-item:hover is in CSS if it exists
                            >
                              <div className="w-6 h-6 rounded-full bg-[#222] flex items-center justify-center mr-2">
                                <svg className="w-3 h-3 reminder-icon" fill="none" stroke={isApproaching ? '#960018' : '#00BF63'} viewBox="0 0 24 24"> {/* Carmine for approaching */}
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="flex-grow" onClick={() => handleEditReminder(reminder)}> {/* Allow click on text to edit */}
                                <div className="flex justify-between">
                                  <h3 className="text-sm font-medium text-white" style={{ fontSize: 'calc(0.8rem * 0.9)' }}>{reminder.title}</h3>
                                </div>
                                <p className="text-xs text-[#aaa]" style={{ fontSize: 'calc(0.7rem * 0.9)' }}>
                                  {isApproaching && daysDiff !== null ? (
                                    <span className="font-bold" style={{ color: isUrgent ? '#960018' : '#D9534F' }}>{getDueText()}</span> /* Carmine for urgent, slightly lighter red for approaching */
                                  ) : reminder.description}
                                </p>
                              </div>
                              <div className="flex flex-col items-end"> 
                                <div className="flex items-end gap-1"> 
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent reminder edit
                                      handleMarkAsPaid(reminder); // Use new handler
                                    }} 
                                    className="bg-[#00BF63] text-black text-xs font-medium px-2 py-0.5 rounded text-center"
                                    style={{ fontSize: 'calc(0.7rem * 0.9)' }}
                                    title="Mark as paid and remove reminder"
                                  >
                                    Paid
                                  </button>

                                  <div className="flex flex-col items-end">
                                    {reminder.amount > 0 && (
                                      <span className="text-[#00BF63] font-bold text-sm" style={{ fontSize: 'calc(0.8rem * 0.9)' }}>
                                        ₹{reminder.amount}
                                      </span>
                                    )}
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-xs font-medium text-white ${ /* Text color to white for better contrast on Carmine */
                                        isUrgent
                                          ? 'bg-[#960018]' // Carmine background for urgent
                                          : isApproaching
                                          ? 'bg-[#D9534F]' // Slightly lighter red/carmine for approaching
                                          : 'bg-[#555]'   // Default grey background
                                      }`}
                                      style={{ fontSize: 'calc(0.7rem * 0.9)' }}
                                    >
                                      {reminder.date}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center"> {/* Group for mail, edit, delete */}
                                    {/* Send Email Button */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent reminder edit
                                        handleSendReminderEmail();
                                      }}
                                      className="text-[#aaa] p-1 hover:text-[#00BF63]"
                                      title="Send email reminder"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                      </svg>
                                    </button>
                                    {/* Edit button */}
                                    <button 
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent reminder edit
                                        handleEditReminder(reminder);
                                      }} 
                                      className="text-[#aaa] p-1"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                                    </button>
                                    
                                    {/* Delete button */}
                                    <button 
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault(); // Prevent reminder edit
                                        const id = reminder.id;
                                        setReminders(prev => prev.filter(r => r.id !== id));
                                      }} 
                                      className="text-[#aaa] p-1 opacity-60 hover:opacity-100"
                                      title="Delete reminder"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popup Form */}
        {isFormOpen && (
          <div className="fixed inset-0 popup-container flex items-center justify-center">
            <div className={`w-[500px] popup-content rounded-lg p-6 shadow-xl`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">{isEditMode ? 'Edit Transaction' : 'Add Transaction'}</h2>
                <button 
                  onClick={handleCloseForm}
                  className="text-[#888888] hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="expense">Paid</option>
                    <option value="income">Received</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select Category</option>
                    {Object.keys(categoryConfig).filter(cat => cat !== 'default').map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                    {customCategories.map((category, index) => (
                      <option key={`custom-${index}`} value={category.name}>
                        {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Description</label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={handleCloseForm} className="cancel-button">
                    Cancel
                  </button>
                  <button type="submit" className="submit-button">
                    {isEditMode ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Courses Modal */}
        {isCourseModalOpen && (
          <div className="fixed inset-0 popup-container flex items-center justify-center z-50">
            <div className="w-[700px] popup-content rounded-lg p-6 shadow-xl relative">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Financial Literacy Courses</h2>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsCartOpen(true)}
                    className="relative flex items-center gap-1 text-white hover:text-[#00BF63]"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cartItems.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-[#00BF63] text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {cartItems.length}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => setIsCourseModalOpen(false)}
                    className="text-[#888888] hover:text-white"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-[#aaa] mb-6">Enhance your financial literacy with our expert-led courses</p>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {availableCourses.map(course => (
                  <div key={course.id} className="bg-[#111] border border-[#333] rounded-lg p-4 flex justify-between items-center"> {/* Removed hover:border-[#00BF63] */}
                    <div>
                      <h3 className="text-white font-medium text-lg">{course.title}</h3>
                      <p className="text-[#aaa] text-sm mt-1">{course.description}</p>
                      <p className="text-[#00BF63] font-medium mt-2">₹{course.price}</p>
                    </div>
                    <button 
                      onClick={() => handleAddToCart({id: course.id, title: course.title, price: course.price})}
                      className={`px-3 py-1.5 rounded text-sm font-medium ${
                        cartItems.some(item => item.id === course.id) 
                          ? 'bg-[#222] text-[#888] cursor-not-allowed' 
                          : 'bg-[#00BF63] text-black hover:bg-[#00a755]'
                      }`}
                      disabled={cartItems.some(item => item.id === course.id)}
                    >
                      {cartItems.some(item => item.id === course.id) ? 'Added to Cart' : 'Add to Cart'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Cart Modal */}
        {isCartOpen && (
          <div className="fixed inset-0 popup-container flex items-center justify-center z-50">
            <div className="w-[500px] popup-content rounded-lg p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Your Cart</h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="text-[#888888] hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto text-[#333]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-[#888] mt-4">Your cart is empty</p>
                  <button 
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCourseModalOpen(true);
                    }}
                    className="mt-4 text-[#00BF63] hover:underline"
                  >
                    Browse courses
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-[#111] p-3 rounded border border-[#333]">
                        <span className="text-white">{item.title}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-[#00BF63]">₹{item.price}</span>
                          <button 
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="text-[#888] hover:text-[#ef4444]"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-[#333] mt-4 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">Total:</span>
                      <span className="text-[#00BF63] font-bold text-xl">₹{getTotalCartValue()}</span>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setIsCartOpen(false);
                        setIsPaymentModalOpen(true);
                      }}
                      className="w-full bg-[#00BF63] text-black font-medium py-2 rounded mt-4 hover:bg-[#00a755]"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {isPaymentModalOpen && (
          <div className="fixed inset-0 popup-container flex items-center justify-center z-50">
            <div className="w-[600px] popup-content rounded-lg p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Payment Options</h2>
                <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="text-[#888888] hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <h3 className="text-white font-medium mb-2">Order Summary</h3>
                <div className="bg-[#111] border border-[#333] rounded p-3">
                  <div className="space-y-2 mb-3">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex justify-between">
                        <span className="text-[#aaa]">{item.title}</span>
                        <span className="text-white">₹{item.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#333] pt-2 flex justify-between font-medium">
                    <span className="text-white">Total:</span>
                    <span className="text-[#00BF63]">₹{getTotalCartValue()}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-medium mb-4">Select Payment Method</h3>
                <div className="space-y-3">
                  <div className="bg-[#111] border border-[#333] p-3 rounded hover:border-[#00BF63] cursor-pointer transition-colors">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center mr-3">
                        <svg className="w-6 h-6 text-[#00BF63]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <span className="text-white">Credit / Debit Card</span>
                    </div>
                  </div>
                  
                  <div className="bg-[#111] border border-[#333] p-3 rounded hover:border-[#00BF63] cursor-pointer transition-colors">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center mr-3">
                        <svg className="w-6 h-6 text-[#00BF63]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2m2 4v4a2 2 0 104 0v-1m-4-3H9m2 0h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-white">UPI / Wallet</span>
                    </div>
                  </div>
                  
                  <div className="bg-[#111] border border-[#333] p-3 rounded hover:border-[#00BF63] cursor-pointer transition-colors">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center mr-3">
                        <svg className="w-6 h-6 text-[#00BF63]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <span className="text-white">Net Banking</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  className="w-full bg-[#00BF63] text-black font-medium py-3 rounded mt-6 hover:bg-[#00a755]"
                  onClick={() => {
                    alert('Payment successful! Courses have been added to your account.');
                    setCartItems([]);
                    setIsPaymentModalOpen(false);
                  }}
                >
                  Complete Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reminder Form Modal */}
        {isReminderFormOpen && (
          <div className="fixed inset-0 popup-container flex items-center justify-center z-50">
            <div className="w-[450px] max-h-[90vh] overflow-y-auto reminders-scrollbar popup-content rounded-lg p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">{isEditingReminder ? 'Edit Reminder' : 'Add Reminder'}</h2>
                <button 
                  onClick={() => setIsReminderFormOpen(false)}
                  className="text-[#888888] hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleReminderSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={reminderFormData.title}
                    onChange={handleReminderFormChange}
                    className="form-input w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white text-sm"
                    placeholder="e.g., Bill Payment"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Description</label>
                  <input
                    type="text"
                    name="description"
                    value={reminderFormData.description}
                    onChange={handleReminderFormChange}
                    className="form-input w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white text-sm"
                    placeholder="e.g., Electricity bill payment"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Amount (₹)</label>
                  <input
                    type="number"
                    name="amount"
                    value={reminderFormData.amount}
                    onChange={handleReminderFormChange}
                    className="form-input w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white text-sm"
                    placeholder="e.g., 500"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-white">Date</label>
                    <input
                      type="text"
                      name="date"
                      value={reminderFormData.date}
                      onChange={handleReminderFormChange}
                      className="form-input w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white text-sm"
                      placeholder="e.g., 15"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-white">Month</label>
                    <select
                      name="month"
                      value={reminderFormData.month}
                      onChange={handleReminderFormChange}
                      className="form-select w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white text-sm"
                      required
                    >
                      <option value="">Select</option>
                      <option value="Jan">Jan</option>
                      <option value="Feb">Feb</option>
                      <option value="Mar">Mar</option>
                      <option value="Apr">Apr</option>
                      <option value="May">May</option>
                      <option value="Jun">Jun</option>
                      <option value="Jul">Jul</option>
                      <option value="Aug">Aug</option>
                      <option value="Sep">Sep</option>
                      <option value="Oct">Oct</option>
                      <option value="Nov">Nov</option>
                      <option value="Dec">Dec</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-white">Year (Optional)</label>
                    <input
                      type="text"
                      name="year"
                      value={reminderFormData.year}
                      onChange={handleReminderFormChange}
                      className="form-input w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white text-sm"
                      placeholder="e.g., 2024"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsReminderFormOpen(false)}
                    className="px-4 py-2 bg-[#333] text-white rounded text-sm hover:bg-[#444]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-[#00BF63] text-black rounded text-sm font-medium hover:bg-[#00a755]"
                  >
                    {isEditingReminder ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Category Form Modal */}
        {isCategoryFormOpen && (
          <div className="fixed inset-0 popup-container flex items-center justify-center z-50">
            <div className="w-[400px] popup-content rounded-lg p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Add New Category</h2>
                <button 
                  onClick={() => setIsCategoryFormOpen(false)}
                  className="text-[#888888] hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Category Name</label>
                  <input
                    type="text"
                    name="name"
                    value={categoryFormData.name}
                    onChange={handleCategoryFormChange}
                    className="form-input w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white text-sm"
                    placeholder="e.g., Education"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Color</label>
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {[
                      'rgba(59, 130, 246, 0.8)', // Blue
                      'rgba(236, 72, 153, 0.8)', // Pink
                      'rgba(16, 185, 129, 0.8)', // Green
                      'rgba(245, 158, 11, 0.8)', // Yellow
                      'rgba(239, 68, 68, 0.8)',  // Red
                      'rgba(139, 92, 246, 0.8)', // Purple
                      'rgba(14, 165, 233, 0.8)', // Light Blue
                      'rgba(168, 85, 247, 0.8)', // Violet
                      'rgba(251, 113, 133, 0.8)', // Rose
                      'rgba(107, 114, 128, 0.8)'  // Gray
                    ].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCategoryFormData(prev => ({ ...prev, color }))}
                        className={`w-full h-8 rounded-md flex items-center justify-center ${categoryFormData.color === color ? 'ring-2 ring-white' : ''}`}
                        style={{ backgroundColor: color }}
                      >
                        {categoryFormData.color === color && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsCategoryFormOpen(false)}
                    className="px-4 py-2 bg-[#333] text-white rounded text-sm hover:bg-[#444]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-[#00BF63] text-black rounded text-sm font-medium hover:bg-[#00a755]"
                  >
                    Add Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Paid Reminders History Modal */}
        {isPaidHistoryModalOpen && (
          <div className="fixed inset-0 popup-container flex items-center justify-center z-50">
            <div className="w-[600px] max-h-[80vh] popup-content rounded-lg p-6 shadow-xl flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Paid Reminders History</h2>
                <button 
                  onClick={() => setIsPaidHistoryModalOpen(false)}
                  className="text-[#888888] hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto reminders-scrollbar pr-2">
                {paidRemindersHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <svg className="w-12 h-12 text-[#333] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <p className="text-[#666] text-sm">No paid reminders in history yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paidRemindersHistory.map(paidItem => (
                      <div key={`paid-${paidItem.id}`} className="bg-[#111] border border-[#222] p-3 rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-md font-medium text-white">{paidItem.name} {/* Assuming 'name' from mapped fields */}</h3>
                            <p className="text-xs text-[#aaa]">{paidItem.description}</p>
                          </div>
                          <div className="text-right">
                             {paidItem.amount > 0 && (
                                <p className="text-md font-semibold text-[#00BF63]">₹{paidItem.amount}</p>
                             )}
                            <p className="text-xs text-[#888]">Due: {paidItem.date}</p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-[#2a2a2a]">
                           <p className="text-xs text-white">
                            Paid on: <span className="font-medium text-[#00BF63]">{paidItem.paidOn}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer isDarkMode={isDarkMode} profileData={profileData} /> {/* Pass profileData here */}
      
      {/* Profile Edit Popup */}
      <ProfileEditPopup 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        onSave={handleProfileSave}
        isNewUser={isNewUser}
      />
      
      {/* Expense History Alternative View (6 months) */}
      <ExpenseHistoryAlternativeView
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        monthlyData={getMonthlySpending(true)} // Pass true to get all 6 months
        getCategorySpending={getCategorySpending}
        formatAmount={formatAmount}
        transactions={transactions} // Pass transactions for detailed view
      />

      {/* Month Detail Popup */}
      <MonthDetailPopup
        isOpen={isMonthDetailsOpen}
        onClose={() => setIsMonthDetailsOpen(false)}
        monthData={selectedMonth}
        getCategorySpending={getCategorySpending}
        formatAmount={formatAmount}
        monthIndex={selectedMonth?.index || 0}
      />
      
      {/* Registration Modal */}
      {isRegistering && (
        <div className="fixed inset-0 popup-container flex items-center justify-center z-50">
          <div className="w-[400px] popup-content rounded-lg p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Create Account</h2>
              <button 
                onClick={() => setIsRegistering(false)}
                className="text-[#888888] hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="reg-name" className="block text-sm font-medium text-[#aaa] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="reg-name"
                  className="form-input"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-[#aaa] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="reg-email"
                  className="form-input"
                  placeholder="Enter your email address"
                />
              </div>
              
              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-[#aaa] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="reg-password"
                  className="form-input"
                  placeholder="Create a password"
                />
              </div>
              
              <div className="mt-6">
                <button
                  onClick={handleRegistrationSubmit}
                  className="w-full px-4 py-2 bg-[#00BF63] text-black font-medium rounded-md hover:bg-[#00a755]"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
