import { useState, useEffect, useRef } from 'react';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel } from 'docx';

function Orders() {
  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State for loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // State for error message
  const [error, setError] = useState('');
  
  // State for confirmation modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [orderToUpdate, setOrderToUpdate] = useState(null);
  const [statusToUpdate, setStatusToUpdate] = useState(0);
  const [statusComment, setStatusComment] = useState('');
  
  // State for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  
  // State for filters
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: '',
    date: ''
  });
  
  // State for pagination
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1
  });
  
  // State for order items in the form
  const [orderItems, setOrderItems] = useState([
    { id: 1, drugId: '', quantity: 1 }
  ]);
  
  // State for form data
  const [formData, setFormData] = useState({
    pharmacyId: '',
  });
  
  // State for user roles
  const [userRoles, setUserRoles] = useState([]);
  
  // State for drug list
  const [drugs, setDrugs] = useState([]);
  
  // State for pharmacy list
  const [pharmacies, setPharmacies] = useState([]);
  
  // State for orders data
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);

  // Export dropdown state
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  
  // Fetch orders from API
  const fetchOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `http://localhost:5137/api/v1/Orders?page=${pagination.page}&pageSize=${pagination.pageSize}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/plain'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      setOrders(data);
      setFilteredOrders(data);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch drugs for order form
  const fetchDrugs = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5137/api/v1/DrugInventory', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/plain'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch drugs');
      }
      
      const data = await response.json();
      setDrugs(data);
    } catch (error) {
      console.error('Error fetching drugs:', error);
      setDrugs([]);
    }
  };
  
  // Fetch pharmacies
  const fetchPharmacies = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5137/api/v1/Suppliers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/plain'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch pharmacies');
      }
      
      const data = await response.json();
      setPharmacies(data);
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
      setPharmacies([
        { id: 1, name: 'City Pharmacy' },
        { id: 2, name: 'Health Center Pharmacy' }
      ]);
    }
  };

  // Export to Word function
  const handleExportWord = async () => {
    setIsLoading(true);
    try {
      // Create table rows for the orders
      const tableRows = filteredOrders.map(order => (
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(`#${order.id}`)]
            }),
            new TableCell({
              children: [new Paragraph(getPharmacyName(order.pharmacyId))]
            }),
            new TableCell({
              children: [new Paragraph(`$${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}`)]
            }),
            new TableCell({
              children: [new Paragraph(getStatusText(order.status))]
            }),
            new TableCell({
              children: [new Paragraph(formatDate(order.createdAt))]
            })
          ]
        })
      ));

      // Create the document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: "Orders Report",
              heading: HeadingLevel.HEADING_1,
              alignment: "center"
            }),
            new Paragraph({
              text: `Generated on: ${new Date().toLocaleDateString()}`,
              alignment: "right",
              spacing: { after: 400 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph("Order ID")]
                    }),
                    new TableCell({
                      children: [new Paragraph("Pharmacy")]
                    }),
                    new TableCell({
                      children: [new Paragraph("Total Amount")]
                    }),
                    new TableCell({
                      children: [new Paragraph("Status")]
                    }),
                    new TableCell({
                      children: [new Paragraph("Date")]
                    })
                  ]
                }),
                ...tableRows
              ]
            }),
            new Paragraph({
              text: `Total Orders: ${filteredOrders.length}`,
              spacing: { before: 400 }
            }),
            new Paragraph({
              text: "End of Report",
              alignment: "center",
              spacing: { before: 800 }
            })
          ]
        }]
      });

      // Generate the Word document
      const blob = await Packer.toBlob(doc);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Orders_Report.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating Word document:', error);
      setError('Failed to generate Word document');
    } finally {
      setIsLoading(false);
      setShowExportDropdown(false);
    }
  };
  
  // Initial data loading and user roles
  useEffect(() => {
    // Get user roles from localStorage
    const roles = localStorage.getItem('roles');
    if (roles) {
      try {
        const parsedRoles = JSON.parse(roles);
        setUserRoles(parsedRoles);
      } catch (error) {
        console.error('Error parsing user roles:', error);
        setUserRoles([]);
      }
    }
    
    fetchOrders();
    fetchDrugs();
    fetchPharmacies();
  }, [pagination.page, pagination.pageSize]);
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  // Open status update modal
  const openStatusUpdateModal = (order) => {
    setOrderToUpdate(order);
    setStatusToUpdate(order.status);
    setStatusComment('');
    setShowStatusModal(true);
  };
  
  // Handle status update
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5137/api/v1/Orders/${orderToUpdate.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/plain'
        },
        body: JSON.stringify({
          status: parseInt(statusToUpdate),
          comments: statusComment
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to update order status');
      }
      
      await fetchOrders();
      setShowStatusModal(false);
      setOrderToUpdate(null);
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(`Failed to update order status: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Open delete confirmation modal
  const confirmDelete = (order) => {
    setOrderToDelete(order);
    setShowDeleteConfirm(true);
  };
  
  // Handle delete order
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:5137/api/v1/Orders/${orderToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'text/plain'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || `Failed to delete order: Status ${response.status}`);
      }
      
      const updatedOrders = orders.filter(order => order.id !== orderToDelete.id);
      setOrders(updatedOrders);
      setFilteredOrders(filteredOrders.filter(order => order.id !== orderToDelete.id));
      
      setShowDeleteConfirm(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      setError(`Failed to delete order: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle order item input changes
  const handleOrderItemChange = (id, field, value) => {
    const updatedOrderItems = orderItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setOrderItems(updatedOrderItems);
  };
  
  // Add new order item
  const addOrderItem = () => {
    const newId = Math.max(...orderItems.map(item => item.id), 0) + 1;
    setOrderItems([...orderItems, { id: newId, drugId: '', quantity: 1 }]);
  };
  
  // Remove order item
  const removeOrderItem = (id) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter(item => item.id !== id));
    }
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      pharmacyId: '',
    });
    setOrderItems([{ id: 1, drugId: '', quantity: 1 }]);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (!formData.pharmacyId) {
      setError('Please select a pharmacy');
      setIsLoading(false);
      return;
    }
    
    const invalidItems = orderItems.filter(item => !item.drugId || item.quantity < 1);
    if (invalidItems.length > 0) {
      setError('Please select a drug and valid quantity for all items');
      setIsLoading(false);
      return;
    }
    
    const token = localStorage.getItem('accessToken');
    const payload = {
      pharmacyId: formData.pharmacyId,
      orderItems: orderItems.map(item => ({
        drugId: parseInt(item.drugId),
        quantity: parseInt(item.quantity)
      }))
    };
    
    try {
      const response = await fetch('http://localhost:5137/api/v1/Orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/plain'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create order');
      }
      
      await fetchOrders();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating order:', error);
      setError(`Failed to create order: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter orders based on search term and filters
  useEffect(() => {
    if (!orders.length) return;
    
    const filtered = orders.filter(order => {
      const matchesSearch = !filters.searchTerm || 
        order.id.toString().includes(filters.searchTerm) || 
        order.pharmacyId.toString().includes(filters.searchTerm);
      
      const matchesStatus = !filters.status || 
        order.status.toString() === filters.status;
      
      const matchesDate = !filters.date || 
        (order.createdAt && new Date(order.createdAt).toISOString().slice(0, 10) === filters.date);
      
      return matchesSearch && matchesStatus && matchesDate;
    });
    
    setFilteredOrders(filtered);
  }, [filters, orders]);
  
  // Handle pagination
  const handlePrevPage = () => {
    if (pagination.page > 1) {
      setPagination({
        ...pagination,
        page: pagination.page - 1
      });
    }
  };
  
  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination({
        ...pagination,
        page: pagination.page + 1
      });
    }
  };
  
  // Get status class based on order status
  const getStatusClass = (status) => {
    switch (status) {
      case 0: // Pending
        return 'px-2 py-1 rounded text-[#d97706] bg-[#fef3c7]';
      case 1: // Completed
        return 'px-2 py-1 rounded text-[#10b981] bg-[#d1fae5]';
      case 2: // Cancelled
        return 'px-2 py-1 rounded text-[#ef4444] bg-[#fee2e2]';
      default:
        return 'px-2 py-1 rounded';
    }
  };
  
  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 0:
        return 'Pending';
      case 1:
        return 'Completed';
      case 2:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Get pharmacy name by ID
  const getPharmacyName = (pharmacyId) => {
    const pharmacy = pharmacies.find(p => p.id.toString() === pharmacyId.toString());
    return pharmacy ? pharmacy.name : `Pharmacy #${pharmacyId}`;
  };
  
  // Get drug name by ID
  const getDrugName = (drugId) => {
    const drug = drugs.find(d => d.id.toString() === drugId.toString());
    return drug ? drug.name : `Drug #${drugId}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Orders Management</h1>
          <p className="text-gray-600">Track and manage pharmacy orders</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }} 
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create New Order
          </button>
          <div className="relative">
            <button 
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center justify-center"
              disabled={isLoading}
              onClick={() => setShowExportDropdown(!showExportDropdown)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export
            </button>
            {showExportDropdown && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button 
                    onClick={handleExportWord}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    disabled={isLoading}
                  >
                    Export as Word
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg">
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <select 
              name="status" 
              value={filters.status} 
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
              disabled={isLoading}
            >
              <option value="">All Statuses</option>
              <option value="0">Pending</option>
              <option value="1">Completed</option>
              <option value="2">Cancelled</option>
            </select>
            <input 
              type="date" 
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
              disabled={isLoading}
            />
          </div>
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              name="searchTerm"
              value={filters.searchTerm}
              onChange={handleFilterChange}
              placeholder="Search orders..." 
              className="border rounded-full px-4 py-2 pl-8 w-full"
              disabled={isLoading}
            />
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="absolute left-2 top-3 h-4 w-4 text-gray-400" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>

        {isLoading && !orders.length ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Loading orders data...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-4 text-left">Order ID</th>
                    <th className="p-4 text-left">Pharmacy</th>
                    <th className="p-4 text-left">Total Amount</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-4 text-center text-gray-500">
                        No orders found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">#{order.id}</td>
                        <td className="p-4">{getPharmacyName(order.pharmacyId)}</td>
                        <td className="p-4">${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}</td>
                        <td className="p-4">
                          <span className={getStatusClass(order.status)}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="p-4">{formatDate(order.createdAt)}</td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <button 
                              className="text-blue-500 hover:text-blue-700"
                              onClick={() => openStatusUpdateModal(order)}
                              disabled={isLoading}
                            >
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-5 w-5" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              >
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                              </svg>
                            </button>
                            <button 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => confirmDelete(order)}
                              disabled={isLoading}
                            >
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-5 w-5" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              >
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center">
              <span className="text-gray-600 mb-2 sm:mb-0">
                Showing page {pagination.page} of {Math.max(pagination.totalPages, 1)}
              </span>
              <div className="flex space-x-2">
                <button 
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                  onClick={handlePrevPage}
                  disabled={pagination.page <= 1 || isLoading}
                >
                  Previous
                </button>
                <button 
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                  onClick={handleNextPage}
                  disabled={pagination.page >= pagination.totalPages || isLoading}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-[600px] p-6 m-4 max-h-90vh overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Create New Order</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Pharmacy</label>
                <select 
                  name="pharmacyId"
                  value={formData.pharmacyId}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2" 
                  required
                  disabled={isLoading}
                >
                  <option value="">Select Pharmacy</option>
                  {pharmacies.map(pharmacy => (
                    <option key={pharmacy.id} value={pharmacy.id}>
                      {pharmacy.name}
                    </option>
                  ))}
                </select>
              </div>
              <div id="order-items-container">
                {orderItems.map(item => (
                  <div key={item.id} className="order-item mb-4 bg-gray-50 p-4 rounded">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <label className="block text-gray-700 mb-2">Drug</label>
                        <select 
                          value={item.drugId}
                          onChange={(e) => handleOrderItemChange(item.id, 'drugId', e.target.value)}
                          className="w-full border rounded px-3 py-2" 
                          required
                          disabled={isLoading}
                        >
                          <option value="">Select Drug</option>
                          {drugs.map(drug => (
                            <option key={drug.id} value={drug.id}>
                              {drug.name} - ${drug.unitPrice ? drug.unitPrice.toFixed(2) : '0.00'}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Quantity</label>
                        <input 
                          type="number" 
                          value={item.quantity}
                          onChange={(e) => handleOrderItemChange(item.id, 'quantity', e.target.value)}
                          className="w-24 border rounded px-3 py-2" 
                          min="1" 
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Actions</label>
                        <button 
                          type="button" 
                          onClick={() => removeOrderItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                          disabled={isLoading || orderItems.length <= 1}
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-5 w-5" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <button 
                  type="button" 
                  onClick={addOrderItem}
                  className="text-blue-500 hover:text-blue-700 flex items-center"
                  disabled={isLoading}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-2" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Another Drug
                </button>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 m-4">
            <h3 className="text-xl font-semibold mb-4">Update Order Status</h3>
            <form onSubmit={handleStatusUpdate}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Status</label>
                <select
                  value={statusToUpdate}
                  onChange={(e) => setStatusToUpdate(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  disabled={isLoading}
                >
                  <option value="0">Pending</option>
                  <option value="1">Completed</option>
                  <option value="2">Cancelled</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Comment</label>
                <textarea
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  rows="3"
                  disabled={isLoading}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 m-4">
            <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this order? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOrder}
                className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600"
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;