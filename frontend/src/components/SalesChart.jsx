import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../context/ThemeContext.jsx';

const SalesChart = ({ salesData }) => {
    const { theme } = useTheme();

    const processData = (data) => {
      const monthlySales = {};
        data.forEach(order => {
            const month = new Date(order.date).toLocaleString('default', { month: 'short' });
            monthlySales[month] = (monthlySales[month] || 0) + order.amount;
        });

        return Object.entries(monthlySales).map(([month, sales]) => {
            {month, sales}
        });
    }

    const chartData = processData(salesData);

    return (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={theme === 'dark' ? '#4b5563' : '#e5e7eb'}
              />
              <XAxis 
                dataKey="month" 
                stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
              />
              <YAxis 
                stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                itemStyle={{ color: theme === 'dark' ? '#ffffff' : '#1f2937' }}
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#6366f1" 
                strokeWidth={2}
                dot={{ fill: '#6366f1', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
          
          {salesData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No sales data available
            </div>
          )}
        </div>
    );
}

export default SalesChart;