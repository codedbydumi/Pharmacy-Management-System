import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'chart.js/auto';

function Dashboard() {
  const navigate = useNavigate();
  const salesChartRef = useRef(null);
  const chartInstance = useRef(null);
  
  // State for user info
  const [userInfo, setUserInfo] = useState({
    email: '',
    roles: []
  });
  
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    drugCount: 0,
    lowStockCount: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    activeSuppliers: 0,
    newRequests: 0
  });
  
  // State for recent activities
  const [recentActivities, setRecentActivities] = useState([]);
  
  // State for loading
  const [isLoading, setIsLoading] = useState(true);
  
  // State for specific section errors
  const [errors, setErrors] = useState({
    drugs: '',
    orders: '',
    suppliers: ''
  });
  
  // State for sales data
  const [salesData, setSalesData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    data: [0, 0, 0, 0, 0, 0]
  });

  // Get user info from localStorage
  useEffect(() => {
    const email = localStorage.getItem('email');
    const rolesStr = localStorage.getItem('roles');
    
    if (email) {
      let roles = [];
      try {
        roles = JSON.parse(rolesStr) || [];
      } catch (error) {
        console.error('Error parsing roles:', error);
      }
      
      setUserInfo({
        email,
        roles
      });
    } else {
      // Redirect to login if not authenticated
      navigate('/');
    }
  }, [navigate]);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      // Reset errors
      setErrors({
        drugs: '',
        orders: '',
        suppliers: ''
      });
      
      const token = localStorage.getItem('accessToken');
      
      // Initialize data variables
      let drugsData = [];
      let ordersData = [];
      let suppliersData = [];
      
      // Fetch drug inventory stats with error handling
      try {
        const drugsResponse = await fetch('http://localhost:5137/api/v1/DrugInventory', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/plain'
          }
        });
        
        if (!drugsResponse.ok) {
          throw new Error(`Failed to fetch drug inventory data: ${drugsResponse.status}`);
        }
        
        drugsData = await drugsResponse.json();
      } catch (error) {
        console.error('Error fetching drugs data:', error);
        setErrors(prev => ({ ...prev, drugs: error.message }));
      }
      
      // Fetch orders with error handling
      try {
        const ordersResponse = await fetch('http://localhost:5137/api/v1/Orders', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/plain'
          }
        });
        
        if (!ordersResponse.ok) {
          throw new Error(`Failed to fetch orders data: ${ordersResponse.status}`);
        }
        
        ordersData = await ordersResponse.json();
      } catch (error) {
        console.error('Error fetching orders data:', error);
        setErrors(prev => ({ ...prev, orders: error.message }));
      }
      
      // Fetch suppliers with error handling - removed role restrictions
      try {
        const suppliersResponse = await fetch('http://localhost:5137/api/v1/Suppliers', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/plain'
          }
        });
        
        if (!suppliersResponse.ok) {
          throw new Error(`Failed to fetch suppliers data: ${suppliersResponse.status}`);
        }
        
        suppliersData = await suppliersResponse.json();
      } catch (error) {
        console.error('Error fetching suppliers data:', error);
        setErrors(prev => ({ ...prev, suppliers: error.message }));
      }
      
      // Calculate dashboard metrics even if some data is missing
      const lowStockItems = drugsData.filter(drug => 
        drug.currentStock !== undefined && 
        drug.minimumStock !== undefined && 
        drug.currentStock < drug.minimumStock
      );
      
      const pendingOrders = ordersData.filter(order => order.status === 0);
      const totalRevenue = ordersData.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const activeSuppliers = suppliersData.filter(supplier => supplier.status === 0);
      
      // Update dashboard data
      setDashboardData({
        drugCount: drugsData.length,
        lowStockCount: lowStockItems.length,
        pendingOrders: pendingOrders.length,
        totalRevenue: totalRevenue,
        activeSuppliers: activeSuppliers.length,
        newRequests: 0 // Placeholder since we don't have this data
      });
      
      // Create recent activities list from both drugs and orders data
      const activities = [
        ...pendingOrders.slice(0, 3).map(order => ({
          text: `New order #${order.id}`,
          status: 'Pending',
          statusColor: 'yellow',
          timestamp: order.createdAt || new Date().toISOString()
        })),
        ...lowStockItems.slice(0, 3).map(drug => ({
          text: `Low stock alert: ${drug.name}`,
          status: 'Warning',
          statusColor: 'red',
          timestamp: new Date().toISOString() // Use current date as fallback
        }))
      ];
      
      // Add timestamps if not available
      const activitiesWithTimestamps = activities.map((activity, index) => {
        if (!activity.timestamp) {
          const date = new Date();
          date.setHours(date.getHours() - index); // Offset by hours for reasonable timestamps
          return {
            ...activity,
            timestamp: date.toISOString()
          };
        }
        return activity;
      });
      
      // Sort by timestamp (most recent first)
      activitiesWithTimestamps.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      setRecentActivities(activitiesWithTimestamps.slice(0, 5));
      
      // Generate sales data from orders
      if (ordersData.length > 0) {
        generateSalesData(ordersData);
      } else {
        // Use mock data if no orders available
        generateMockSalesData();
      }
      
      setIsLoading(false);
    };
    
    // Generate sales data from orders
    const generateSalesData = (ordersData) => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const last6Months = [];
      const last6MonthsData = [];
      
      // Initialize sales data with zeros
      const monthlySales = {};
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const monthKey = `${monthIndex}-${monthIndex > currentMonth ? currentYear - 1 : currentYear}`;
        monthlySales[monthKey] = 0;
        last6Months.push(monthNames[monthIndex]);
      }
      
      // Aggregate order amounts by month
      ordersData.forEach(order => {
        if (!order.createdAt) return;
        
        const orderDate = new Date(order.createdAt);
        const orderMonth = orderDate.getMonth();
        const orderYear = orderDate.getFullYear();
        const monthKey = `${orderMonth}-${orderYear}`;
        
        // Only include orders from the last 6 months
        if (monthlySales.hasOwnProperty(monthKey)) {
          monthlySales[monthKey] += (order.totalAmount || 0);
        }
      });
      
      // Convert the aggregated data to array format
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const monthKey = `${monthIndex}-${monthIndex > currentMonth ? currentYear - 1 : currentYear}`;
        last6MonthsData.push(monthlySales[monthKey]);
      }
      
      setSalesData({
        labels: last6Months,
        data: last6MonthsData
      });
    };
    
    // Generate mock sales data when no orders are available
    const generateMockSalesData = () => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      const last6Months = [];
      
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        last6Months.push(monthNames[monthIndex]);
      }
      
      // Generate random sales data between 5000 and 15000
      const mockData = Array(6).fill().map(() => Math.floor(Math.random() * 10000) + 5000);
      
      setSalesData({
        labels: last6Months,
        data: mockData
      });
    };
    
    // Only fetch if user is authenticated
    if (userInfo.email) {
      fetchDashboardData();
    }
  }, [userInfo.email, userInfo.roles]);
  
  // Initialize chart with improved configuration
  useEffect(() => {
    if (salesChartRef.current && !isLoading && salesData.data.length > 0) {
      // Destroy previous chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = salesChartRef.current.getContext('2d');
      
      // Create gradient for better visual appeal
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(75, 192, 192, 0.6)');
      gradient.addColorStop(1, 'rgba(75, 192, 192, 0.1)');
      
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: salesData.labels,
          datasets: [{
            label: 'Monthly Sales',
            data: salesData.data,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: gradient,
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: 'rgb(75, 192, 192)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(75, 192, 192)',
            pointHoverBorderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                font: {
                  size: 14,
                  weight: 'bold'
                },
                color: '#374151',
                padding: 20
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: 'rgb(75, 192, 192)',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: false,
              callbacks: {
                label: function(context) {
                  return `Sales: ${formatCurrency(context.parsed.y)}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: '#6B7280',
                font: {
                  size: 12,
                  weight: 'bold'
                }
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)',
                drawBorder: false
              },
              ticks: {
                color: '#6B7280',
                font: {
                  size: 12
                },
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          },
          elements: {
            line: {
              borderJoinStyle: 'round'
            }
          },
          animation: {
            duration: 2000,
            easing: 'easeInOutQuart'
          }
        }
      });
    }

    // Cleanup on component unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [salesData, isLoading]);

  const handleLogout = () => {
    // Clear all auth tokens and user info
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('email');
    localStorage.removeItem('userId');
    localStorage.removeItem('roles');
    
    // Redirect to login page
    navigate('/');
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Date unavailable';
    }
  };
  
  // Get role display
  const getRoleDisplay = () => {
    if (!userInfo.roles || userInfo.roles.length === 0) return 'User';
    
    // Convert role names to title case
    return userInfo.roles.map(role => 
      role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
    ).join(', ');
  };

  return (
    <div className="font-sans antialiased bg-[#f4f6f9] min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Pharmacy Management Dashboard</h1>
            <div className="text-gray-600 mt-1">
              Welcome, <span className="font-semibold">{userInfo.email}</span> • 
              <span className="ml-1 text-blue-600">{getRoleDisplay()}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-white border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button 
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </header>

        {Object.values(errors).some(error => error) && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">Some data could not be loaded:</h3>
            <ul className="list-disc list-inside text-yellow-700 space-y-1">
              {errors.drugs && <li>{errors.drugs}</li>}
              {errors.orders && <li>{errors.orders}</li>}
              {errors.suppliers && <li>{errors.suppliers}</li>}
            </ul>
          </div>
        )}

        {isLoading ? (
          <div className="w-full flex justify-center items-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="ml-2">Loading dashboard data...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Drug Inventory Card - Available to all users */}
              <div 
                className="dashboard-card bg-white shadow-lg rounded-lg p-6 cursor-pointer hover:shadow-xl transition duration-300"
                onClick={() => navigate('/drug-inventory')}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Drug Inventory</h2>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 01-4.686-4.686l-.477-2.387a2 2 0 00-.547-1.022L6 5m8 8l-1.535-1.535a2 2 0 00-2.172-.463L8.243 9.19c-.562.267-1.109.61-1.621 1.042C4.241 11.715 2.25 14.189 2.25 17.25c0 3.038 2.44 5.25 5.25 5.25h10.5c2.81 0 5.121-2.212 5.25-5.25.089-2.53-1.411-4.257-2.25-5.035-1.109-.971-2.434-1.452-3.534-1.742z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-600">Total Drugs: <span className="font-bold text-blue-600">{dashboardData.drugCount}</span></p>
                  <p className="text-gray-600">Low Stock Alerts: <span className="font-bold text-red-600">{dashboardData.lowStockCount}</span></p>
                </div>
              </div>

              {/* Orders Card - Available to all users */}
              <div 
                className="dashboard-card bg-white shadow-lg rounded-lg p-6 cursor-pointer hover:shadow-xl transition duration-300"
                onClick={() => navigate('/orders')}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Orders</h2>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-600">Pending Orders: <span className="font-bold text-green-600">{dashboardData.pendingOrders}</span></p>
                  <p className="text-gray-600">Total Revenue: <span className="font-bold text-purple-600">{formatCurrency(dashboardData.totalRevenue)}</span></p>
                </div>
              </div>

              {/* Suppliers Card - Now available to all users */}
              <div 
                className="dashboard-card bg-white shadow-lg rounded-lg p-6 cursor-pointer hover:shadow-xl transition duration-300"
                onClick={() => navigate('/suppliers')}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Suppliers</h2>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.768-.152-1.509-.44-2.192M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.768.152-1.509.44-2.192m0 0a5.002 5.002 0 019.12 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-600">Active Suppliers: <span className="font-bold text-purple-600">{dashboardData.activeSuppliers}</span></p>
                  <p className="text-gray-600">New Requests: <span className="font-bold text-yellow-600">{dashboardData.newRequests}</span></p>
                </div>
                {errors.suppliers && (
                  <p className="text-sm text-red-500 mt-2">⚠️ {errors.suppliers}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              {/* Sales Chart - Enhanced */}
              <div className="bg-white shadow-lg rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Monthly Sales</h2>
                  <div className="text-sm text-gray-500">
                    Last 6 months
                  </div>
                </div>
                <div className="h-80 relative">
                  {salesData.data.length > 0 ? (
                    <canvas ref={salesChartRef}></canvas>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                        <p className="text-gray-500">Loading chart data...</p>
                      </div>
                    </div>
                  )}
                </div>
                {errors.orders && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-700 text-center">
                      📊 Showing mock data due to error loading orders
                    </p>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 mt-2">No recent activities to display</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {recentActivities.map((activity, index) => (
                      <li key={index} className="py-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-gray-700 font-medium">{activity.text}</p>
                            <p className="text-gray-500 text-sm">{formatDate(activity.timestamp)}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-sm font-medium bg-${activity.statusColor}-100 text-${activity.statusColor}-800`}>
                            {activity.status}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {recentActivities.length > 0 && (
                  <div className="mt-4 text-center">
                    <button 
                      className="text-blue-500 hover:text-blue-700 font-medium"
                      onClick={() => navigate('/activities')}
                    >
                      View all activities
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;