import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel } from 'docx';

function DrugInventory() {
  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  // State for the current drug being edited
  const [currentDrugId, setCurrentDrugId] = useState(null);
  // State for form data
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    description: '',
    category: '',
    unitPrice: '',
    minimumStock: '',
    requiresPrescription: false,
    supplierId: 1
  });
  // State for filters
  const [filters, setFilters] = useState({
    searchTerm: '',
    category: '',
    stockStatus: ''
  });
  // State for loading status
  const [isLoading, setIsLoading] = useState(false);
  // State for error message
  const [error, setError] = useState('');
  // State for inventory data
  const [drugs, setDrugs] = useState([]);
  // State for filtered drugs
  const [filteredDrugs, setFilteredDrugs] = useState([]);
  // State for confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [drugToDelete, setDrugToDelete] = useState(null);
  // State for export dropdown
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Create a ref for the component to print
  const componentRef = useRef();

  // Export to PDF function
  const handleExportPDF = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: `
      @page {
        size: A4;
        margin: 1cm;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      th {
        background-color: #f2f2f2;
      }
      .print-title {
        text-align: center;
        margin-bottom: 20px;
        font-size: 24px;
        font-weight: bold;
      }
      .print-date {
        text-align: right;
        margin-bottom: 20px;
        font-size: 12px;
      }
      .print-footer {
        margin-top: 30px;
        text-align: center;
        font-size: 10px;
        color: #666;
      }
    `,
    documentTitle: 'Drug_Inventory_Report',
    onBeforeGetContent: () => {
      const printContent = document.getElementById('print-content');
      if (printContent) {
        printContent.style.display = 'block';
      }
    },
    onAfterPrint: () => {
      const printContent = document.getElementById('print-content');
      if (printContent) {
        printContent.style.display = 'none';
      }
    }
  });

  // Export to Word function
  const handleExportWord = async () => {
    setIsLoading(true);
    try {
      // Create table rows for the drugs
      const tableRows = filteredDrugs.map(drug => (
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(drug.name)]
            }),
            new TableCell({
              children: [new Paragraph(drug.genericName)]
            }),
            new TableCell({
              children: [new Paragraph(drug.category)]
            }),
            new TableCell({
              children: [new Paragraph(`$${parseFloat(drug.unitPrice).toFixed(2)}`)]
            }),
            new TableCell({
              children: [new Paragraph(drug.minimumStock.toString())]
            }),
            new TableCell({
              children: [new Paragraph(drug.requiresPrescription ? "Required" : "Not Required")]
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
              text: "Drug Inventory Report",
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
                      children: [new Paragraph("Drug Name")]
                    }),
                    new TableCell({
                      children: [new Paragraph("Generic Name")]
                    }),
                    new TableCell({
                      children: [new Paragraph("Category")]
                    }),
                    new TableCell({
                      children: [new Paragraph("Unit Price")]
                    }),
                    new TableCell({
                      children: [new Paragraph("Min Stock")]
                    }),
                    new TableCell({
                      children: [new Paragraph("Prescription")]
                    })
                  ]
                }),
                ...tableRows
              ]
            }),
            new Paragraph({
              text: `Total Drugs: ${filteredDrugs.length}`,
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
      link.download = 'Drug_Inventory_Report.docx';
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

  // Fetch all drugs from API
  const fetchDrugs = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5137/api/v1/DrugInventory', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/plain'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch drug inventory');
      }
      
      const data = await response.json();
      setDrugs(data);
      setFilteredDrugs(data);
    } catch (error) {
      console.error('Error fetching drugs:', error);
      setError('Error loading inventory data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch drugs on component mount
  useEffect(() => {
    fetchDrugs();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      genericName: '',
      description: '',
      category: '',
      unitPrice: '',
      minimumStock: '',
      requiresPrescription: false,
      supplierId: 1
    });
    setIsEditMode(false);
    setCurrentDrugId(null);
  };

  // Open modal for adding new drug
  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Open modal for editing drug
  const openEditModal = async (id) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5137/api/v1/DrugInventory/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/plain'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch drug details');
      }
      
      const drug = await response.json();
      setFormData({
        name: drug.name,
        genericName: drug.genericName,
        description: drug.description || '',
        category: drug.category,
        unitPrice: drug.unitPrice,
        minimumStock: drug.minimumStock,
        requiresPrescription: drug.requiresPrescription,
        supplierId: drug.supplierId
      });
      setIsEditMode(true);
      setCurrentDrugId(id);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching drug details:', error);
      setError('Failed to load drug details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const token = localStorage.getItem('accessToken');
    const payload = {
      name: formData.name,
      genericName: formData.genericName,
      description: formData.description,
      category: formData.category,
      unitPrice: parseFloat(formData.unitPrice),
      minimumStock: parseInt(formData.minimumStock),
      requiresPrescription: formData.requiresPrescription,
      supplierId: parseInt(formData.supplierId)
    };
    
    try {
      let response;
      
      if (isEditMode) {
        // Update existing drug
        response = await fetch(`http://localhost:5137/api/v1/DrugInventory/${currentDrugId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/plain'
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create new drug
        response = await fetch('http://localhost:5137/api/v1/DrugInventory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/plain'
          },
          body: JSON.stringify(payload)
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Operation failed');
      }
      
      // Refetch drugs after successful operation
      await fetchDrugs();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving drug:', error);
      setError(`Failed to ${isEditMode ? 'update' : 'add'} drug: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm delete modal
  const confirmDelete = (id) => {
    setDrugToDelete(id);
    setShowDeleteConfirm(true);
  };

  // Delete drug
  const handleDeleteDrug = async () => {
    if (!drugToDelete) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5137/api/v1/DrugInventory/${drugToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete drug');
      }
      
      // Refetch drugs after successful deletion
      await fetchDrugs();
      setShowDeleteConfirm(false);
      setDrugToDelete(null);
    } catch (error) {
      console.error('Error deleting drug:', error);
      setError('Failed to delete drug. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  // Filter drugs based on search term and filters
  useEffect(() => {
    if (!drugs.length) return;
    
    const filtered = drugs.filter(drug => {
      // Search term filter
      const matchesSearch = !filters.searchTerm || 
                            drug.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                            drug.genericName.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      // Category filter
      const matchesCategory = !filters.category || drug.category.toLowerCase().includes(filters.category.toLowerCase());
      
      // Stock status filter
      const matchesStock = !filters.stockStatus || 
                          (filters.stockStatus === 'low' && drug.minimumStock < 100) || 
                          (filters.stockStatus === 'adequate' && drug.minimumStock >= 100);
      
      return matchesSearch && matchesCategory && matchesStock;
    });
    
    setFilteredDrugs(filtered);
  }, [filters, drugs]);

  // Determine stock status class
  const getStockStatusClass = (stock) => {
    return stock < 100 
      ? 'px-2 py-1 rounded bg-yellow-100 text-yellow-800' 
      : 'px-2 py-1 rounded bg-green-100 text-green-800';
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
          <h1 className="text-3xl font-bold text-gray-800">Drug Inventory</h1>
          <p className="text-gray-600">Manage and track pharmaceutical inventory</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={openAddModal} 
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New Drug
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

      {/* Print content - moved outside main content container */}
      <div id="print-content" style={{ display: 'none' }} ref={componentRef}>
        <div className="p-4">
          <h1 className="print-title">Drug Inventory Report</h1>
          <div className="print-date">
            Generated on: {new Date().toLocaleDateString()}
          </div>
          <table>
            <thead>
              <tr>
                <th>Drug Name</th>
                <th>Generic Name</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Min Stock</th>
                <th>Prescription</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrugs.map(drug => (
                <tr key={drug.id}>
                  <td>{drug.name}</td>
                  <td>{drug.genericName}</td>
                  <td>{drug.category}</td>
                  <td>${parseFloat(drug.unitPrice).toFixed(2)}</td>
                  <td>{drug.minimumStock}</td>
                  <td>{drug.requiresPrescription ? "Required" : "Not Required"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="print-footer">
            Total Drugs: {filteredDrugs.length} | Generated by Pharmacy Management System
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg">
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <select 
              name="category" 
              value={filters.category} 
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
              disabled={isLoading}
            >
              <option value="">All Categories</option>
              <option value="pain-relief">Pain Relief</option>
              <option value="antibiotics">Antibiotics</option>
              <option value="cardiovascular">Cardiovascular</option>
            </select>
            <select 
              name="stockStatus" 
              value={filters.stockStatus} 
              onChange={handleFilterChange}
              className="border rounded px-2 py-1"
              disabled={isLoading}
            >
              <option value="">Stock Status</option>
              <option value="low">Low Stock</option>
              <option value="adequate">Adequate Stock</option>
            </select>
          </div>
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              name="searchTerm"
              value={filters.searchTerm}
              onChange={handleFilterChange}
              placeholder="Search drugs..." 
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
            <p className="mt-2 text-gray-600">Loading inventory data...</p>
          </div>
        )}

        {!isLoading && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-4 text-left">Drug Name</th>
                    <th className="p-4 text-left">Generic Name</th>
                    <th className="p-4 text-left">Category</th>
                    <th className="p-4 text-left">Unit Price</th>
                    <th className="p-4 text-left">Min Stock</th>
                    <th className="p-4 text-left">Prescription</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrugs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-4 text-center text-gray-500">
                        No drugs found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    filteredDrugs.map(drug => (
                      <tr key={drug.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">{drug.name}</td>
                        <td className="p-4">{drug.genericName}</td>
                        <td className="p-4">{drug.category}</td>
                        <td className="p-4">${parseFloat(drug.unitPrice).toFixed(2)}</td>
                        <td className="p-4">
                          <span className={getStockStatusClass(drug.minimumStock)}>{drug.minimumStock}</span>
                        </td>
                        <td className="p-4">
                          {drug.requiresPrescription ? (
                            <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">Required</span>
                          ) : (
                            <span className="px-2 py-1 rounded bg-gray-100 text-gray-800">Not Required</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => openEditModal(drug.id)} 
                              className="text-blue-500 hover:text-blue-700"
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
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                              </svg>
                            </button>
                            <button 
                              onClick={() => confirmDelete(drug.id)} 
                              className="text-red-500 hover:text-red-700"
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
                Showing {filteredDrugs.length > 0 ? 1 : 0}-{filteredDrugs.length} of {drugs.length} drugs
              </span>
              <div className="flex space-x-2">
                <button className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50" disabled>Previous</button>
                <button className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50" disabled>Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Drug Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 p-6 max-h-90vh overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">{isEditMode ? 'Edit Drug' : 'Add New Drug'}</h2>
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
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Drug Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2" 
                  required 
                  disabled={isLoading}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Generic Name</label>
                <input 
                  type="text" 
                  name="genericName"
                  value={formData.genericName}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2" 
                  required 
                  disabled={isLoading}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2" 
                  rows="3"
                  disabled={isLoading}
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Category</label>
                <input 
                  type="text" 
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2" 
                  required 
                  disabled={isLoading}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Unit Price</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  name="unitPrice"
                  value={formData.unitPrice}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2" 
                  required 
                  disabled={isLoading}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Minimum Stock</label>
                <input 
                  type="number" 
                  min="0"
                  name="minimumStock"
                  value={formData.minimumStock}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2" 
                  required 
                  disabled={isLoading}
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center text-gray-700">
                  <input 
                    type="checkbox" 
                    name="requiresPrescription"
                    checked={formData.requiresPrescription}
                    onChange={handleInputChange}
                    className="mr-2" 
                    disabled={isLoading}
                  />
                  Requires Prescription
                </label>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Supplier ID</label>
                <input 
                  type="number" 
                  min="1"
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2" 
                  required 
                  disabled={isLoading}
                />
              </div>
              <div className="flex justify-end space-x-2">
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
                  {isEditMode ? 'Update' : 'Save'}
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
            <p className="text-gray-700 mb-6">Are you sure you want to delete this drug? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setShowDeleteConfirm(false)} 
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteDrug} 
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

export default DrugInventory;