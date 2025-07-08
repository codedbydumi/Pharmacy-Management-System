import { useState, useEffect, useRef } from 'react';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel } from 'docx';

function Suppliers() {
  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State for form data
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    email: '',
    phone: '',
    address: '',
    status: 0
  });
  
  // State for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSupplierId, setCurrentSupplierId] = useState(null);
  
  // State for filters
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: ''
  });
  
  // State for loading and error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State for suppliers data
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1
  });
  
  // Confirmation modal for delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  
  // User roles
  const [userRoles, setUserRoles] = useState([]);

  // Export dropdown state
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  
  // Check if user has required role
  const hasRole = (requiredRoles) => {
    if (!userRoles || userRoles.length === 0) return false;
    return requiredRoles.some(role => userRoles.includes(role));
  };
  
  // Fetch suppliers from API
  const fetchSuppliers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `http://localhost:5137/api/v1/Suppliers?page=${pagination.page}&pageSize=${pagination.pageSize}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/plain'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }
      
      const data = await response.json();
      setSuppliers(data);
      setFilteredSuppliers(data);
      
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setError('Failed to load suppliers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Export to Word function
  const handleExportWord = async () => {
    setIsLoading(true);
    try {
      // Create table rows for the suppliers
      const tableRows = filteredSuppliers.map(supplier => (
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(supplier.name)]
            }),
            new TableCell({
              children: [new Paragraph(supplier.licenseNumber)]
            }),
            new TableCell({
              children: [new Paragraph(supplier.email)]
            }),
            new TableCell({
              children: [new Paragraph(supplier.phone)]
            }),
            new TableCell({
              children: [new Paragraph(supplier.address || 'N/A')]
            }),
            new TableCell({
              children: [new Paragraph(supplier.status === 0 ? "Active" : "Inactive")]
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
              text: "Suppliers Report",
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
                      children: [new Paragraph("Supplier Name")]
                    }),
                    new TableCell({
                      children: [new Paragraph("License Number")]
                    }),
                    new TableCell({
                      children: [new Paragraph("Email")]
                    }),
                    new TableCell({
                      children: [new Paragraph("Phone")]
                    }),
                    new TableCell({
                      children: [new Paragraph("Address")]
                    }),
                    new TableCell({
                      children: [new Paragraph("Status")]
                    })
                  ]
                }),
                ...tableRows
              ]
            }),
            new Paragraph({
              text: `Total Suppliers: ${filteredSuppliers.length}`,
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
      link.download = 'Suppliers_Report.docx';
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
    
    fetchSuppliers();
  }, [pagination.page, pagination.pageSize]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    // Convert status to number if it's the status field
    const newValue = id === 'status' ? parseInt(value) : value;
    
    setFormData({
      ...formData,
      [id]: newValue
    });
  };
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { id, value } = e.target;
    setFilters({
      ...filters,
      [id === 'search-input' ? 'searchTerm' : 'status']: value
    });
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      licenseNumber: '',
      email: '',
      phone: '',
      address: '',
      status: 0
    });
    setIsEditMode(false);
    setCurrentSupplierId(null);
  };
  
  // Open the modal for adding a new supplier
  const handleAddSupplier = () => {
    resetForm();
    setIsModalOpen(true);
  };
  
  // Open the modal for editing an existing supplier
  const handleEditSupplier = async (id) => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5137/api/v1/Suppliers/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/plain'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch supplier details');
      }
      
      const supplier = await response.json();
      
      setFormData({
        name: supplier.name,
        licenseNumber: supplier.licenseNumber,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address || '',
        status: supplier.status
      });
      
      setIsEditMode(true);
      setCurrentSupplierId(id);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching supplier details:', error);
      setError('Failed to load supplier details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Open delete confirmation modal
  const confirmDelete = (id) => {
    setSupplierToDelete(id);
    setShowDeleteConfirm(true);
  };
  
  // Handle delete supplier
  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5137/api/v1/Suppliers/${supplierToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 403) {
        throw new Error('You do not have permission to delete suppliers.');
      }
      
      if (!response.ok) {
        throw new Error('Failed to delete supplier');
      }
      
      // Refetch suppliers after successful deletion
      await fetchSuppliers();
      setShowDeleteConfirm(false);
      setSupplierToDelete(null);
    } catch (error) {
      console.error('Error deleting supplier:', error);
      setError(`Failed to delete supplier: ${error.message}`);
      setShowDeleteConfirm(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const token = localStorage.getItem('accessToken');
    const payload = {
      name: formData.name,
      licenseNumber: formData.licenseNumber,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      status: formData.status
    };
    
    try {
      let response;
      
      if (isEditMode) {
        // Update existing supplier
        response = await fetch(`http://localhost:5137/api/v1/Suppliers/${currentSupplierId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/plain'
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create new supplier
        response = await fetch('http://localhost:5137/api/v1/Suppliers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/plain'
          },
          body: JSON.stringify(payload)
        });
      }
      
      if (response.status === 403) {
        throw new Error('You do not have permission to perform this action.');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Operation failed');
      }
      
      // Refetch suppliers after successful operation
      await fetchSuppliers();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving supplier:', error);
      setError(`Failed to ${isEditMode ? 'update' : 'add'} supplier: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter suppliers based on search term and status
  useEffect(() => {
    if (!suppliers.length) return;
    
    const filtered = suppliers.filter(supplier => {
      // Search term filter
      const matchesSearch = !filters.searchTerm || 
        supplier.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) || 
        supplier.email.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = !filters.status || 
        (filters.status === '0' && supplier.status === 0) || 
        (filters.status === '1' && supplier.status === 1);
      
      return matchesSearch && matchesStatus;
    });
    
    setFilteredSuppliers(filtered);
  }, [filters, suppliers]);
  
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
  
  // Get status class based on supplier status
  const getStatusClass = (status) => {
    return status === 0
      ? 'px-2 py-1 rounded text-[#10b981] bg-[#d1fae5]' 
      : 'px-2 py-1 rounded text-[#ef4444] bg-[#fee2e2]';
  };
  
  // Get status text
  const getStatusText = (status) => {
    return status === 0 ? 'Active' : 'Inactive';
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
          <h1 className="text-3xl font-bold text-gray-800">Suppliers Management</h1>
          <p className="text-gray-600">Manage and track pharmaceutical suppliers</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={handleAddSupplier} 
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New Supplier
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
          <div className="flex space-x-4">
            <select 
              id="status" 
              value={filters.status} 
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
              disabled={isLoading}
            >
              <option value="">All Statuses</option>
              <option value="0">Active</option>
              <option value="1">Inactive</option>
            </select>
          </div>
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              id="search-input" 
              placeholder="Search suppliers..." 
              value={filters.searchTerm}
              onChange={handleFilterChange}
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

        {isLoading && (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Loading suppliers data...</p>
          </div>
        )}

        {!isLoading && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-4 text-left">Supplier Name</th>
                    <th className="p-4 text-left">License Number</th>
                    <th className="p-4 text-left">Email</th>
                    <th className="p-4 text-left">Phone</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-4 text-center text-gray-500">
                        No suppliers found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map(supplier => (
                      <tr key={supplier.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">{supplier.name}</td>
                        <td className="p-4">{supplier.licenseNumber}</td>
                        <td className="p-4">{supplier.email}</td>
                        <td className="p-4">{supplier.phone}</td>
                        <td className="p-4">
                          <span className={getStatusClass(supplier.status)}>
                            {getStatusText(supplier.status)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <button 
                              className="text-blue-500 hover:text-blue-700"
                              onClick={() => handleEditSupplier(supplier.id)}
                              disabled={isLoading}
                            >
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="w-5 h-5" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            </button>
                            <button 
                              className="text-green-500 hover:text-green-700"
                              onClick={() => handleEditSupplier(supplier.id)}
                              disabled={isLoading}
                            >
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="w-5 h-5" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              >
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                              </svg>
                            </button>
                            <button 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => confirmDelete(supplier.id)}
                              disabled={isLoading}
                            >
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="w-5 h-5" 
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

      {/* Add/Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-[500px] p-6 m-4 max-h-90vh overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">
                {isEditMode ? 'Edit Supplier' : 'Add New Supplier'}
              </h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }} 
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-gray-700 mb-2" htmlFor="name">Supplier Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2" 
                    required 
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="licenseNumber">License Number</label>
                  <input 
                    type="text" 
                    id="licenseNumber" 
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2" 
                    required 
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="status">Status</label>
                  <select 
                    id="status" 
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2"
                    disabled={isLoading}
                  >
                    <option value={0}>Active</option>
                    <option value={1}>Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="email">Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2" 
                    required 
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="phone">Phone Number</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2" 
                    required 
                    disabled={isLoading}
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-gray-700 mb-2" htmlFor="address">Address</label>
                  <textarea 
                    id="address" 
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2" 
                    rows="3"
                    disabled={isLoading}
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                  disabled={isLoading}
                >
                  {isLoading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isEditMode ? 'Update Supplier' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 p-6">
            <h2 className="text-xl font-semibold mb-4">Confirm Delete</h2>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this supplier? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setShowDeleteConfirm(false)} 
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteSupplier} 
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center"
                disabled={isLoading}
              >
                {isLoading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Suppliers;