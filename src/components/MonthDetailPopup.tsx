import React from 'react';
import { Doughnut } from 'react-chartjs-2';

export interface MonthDetailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  monthData: { month: string; total: number } | null;
  getCategorySpending: (monthIndex: number) => { category: string; value: number; color: string }[];
  formatAmount: (amount: number) => string;
  monthIndex: number;
}

const MonthDetailPopup: React.FC<MonthDetailPopupProps> = ({
  isOpen,
  onClose,
  monthData,
  getCategorySpending,
  formatAmount,
  monthIndex,
}) => {
  if (!isOpen || !monthData) return null;

  const categoryData = getCategorySpending(monthIndex);
  
  const chartData = {
    labels: categoryData.map(item => item.category),
    datasets: [
      {
        data: categoryData.map(item => item.value),
        backgroundColor: categoryData.map(item => item.color),
        borderColor: categoryData.map(item => item.color.replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: false, // Hide the legend since we're showing it separately
        position: 'right' as const,
        labels: {
          color: '#ffffff',
          font: {
            size: 12,
            family: "'League Spartan', sans-serif"
          }
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
              label += context.parsed + '%';
            }
            return label;
          }
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 popup-container flex items-center justify-center z-50 bg-black bg-opacity-75">
      <div className="w-[500px] popup-content rounded-lg p-6 shadow-xl relative bg-[#0a0a0a]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">{monthData.month} Expense Breakdown</h2>
          <button 
            onClick={onClose}
            className="text-[#888888] hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="text-white text-xl mb-4">
          Total: <span className="text-[#00BF63] font-bold">₹{formatAmount(monthData.total)}</span>
        </div>
        
        <div className="h-72 relative mb-6">
          <Doughnut 
            data={chartData} 
            options={chartOptions}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {categoryData.map((item, i) => (
            <div key={i} className="bg-[#111] border border-[#333] p-2 rounded flex justify-between items-center">
              <div className="flex items-center">
                <span 
                  className="w-3.5 h-3.5 rounded-sm mr-2"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-white text-sm capitalize">{item.category}</span>
              </div>
              <span className="text-sm font-medium text-white">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MonthDetailPopup;
