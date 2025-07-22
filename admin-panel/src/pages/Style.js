import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/Style.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function Style() {
  const [styles, setStyles] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { userData } = useContext(AuthContext);

  // Modal states
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [editingStyle, setEditingStyle] = useState(null);

  const company_code = userData?.company_code;

  // Form states updated for multiple images
  const [styleForm, setStyleForm] = useState({
    name: '',
    description: '',
    category_id: '',
    main_category_id: '',
    images: [],
    company_code: company_code,
    approved: 'no'
  });

  // API Functions
  const fetchStyles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/get-styles?company_code=${company_code}`);
      const data = await response.json();
      if (data.success) {
        setStyles(data.styles);
      } else {
        setError(data.message || 'Failed to fetch styles');
      }
    } catch (err) {
      setError('Error fetching styles');
    }
    setLoading(false);
  }, [company_code]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/get-categories?company_code=${company_code}`);
      const data = await response.json();
      if (data.success) {
        const mainCats = data.categories.filter(cat => !cat.parent_id);
        setMainCategories(mainCats);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, [company_code]);

  // Fetch all data on component mount
  useEffect(() => {
    fetchStyles();
    fetchCategories();
  }, [fetchStyles, fetchCategories]);

  const handleAddStyle = () => {
    setEditingStyle(null);
    setSelectedMainCategory('');
    setStyleForm({
      name: '',
      description: '',
      category_id: '',
      main_category_id: '',
      images: [],
      company_code: company_code,
      approved: 'no'
    });
    setShowStyleModal(true);
  };

  const tableActions = useMemo(() => ({
    handleEditStyle: (style) => {
      setEditingStyle(style);
      const subcategory = subCategories.find(sub => parseInt(sub.category_id) === parseInt(style.category_id));
      const mainCategoryId = subcategory?.parent_id || '';
      setSelectedMainCategory(mainCategoryId.toString());
      setStyleForm({
        name: style.name,
        description: style.description || '',
        category_id: style.category_id.toString(),
        main_category_id: mainCategoryId.toString(),
        images: [],
        company_code: company_code,
        approved: style.approved || 'no'
      });
      setShowStyleModal(true);
    },
    handleDeleteStyle: async (styleId) => {
      if (window.confirm('Are you sure you want to delete this style?')) {
        try {
          const response = await fetch(`${BASE_URL}/api/delete-styles/${styleId}`, {
            method: 'DELETE'
          });

          const data = await response.json();
          
          if (data.success) {
            setSuccess('Style deleted successfully!');
            fetchStyles();
            setTimeout(() => setSuccess(''), 3000);
          } else {
            setError(data.message || 'Failed to delete style');
          }
        } catch (err) {
          setError('Error deleting style');
        }
      }
    }
  }), [company_code, subCategories, fetchStyles]);

  const handleSaveStyle = async () => {
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      Object.keys(styleForm).forEach(key => {
        if (key === 'images') {
          styleForm.images.forEach(image => {
            formData.append('images', image);
          });
        } else {
          formData.append(key, styleForm[key]);
        }
      });

      const url = editingStyle 
        ? `${BASE_URL}/api/update-styles/${editingStyle.style_id}`
        : `${BASE_URL}/api/add-styles`;
      
      const method = editingStyle ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(editingStyle ? 'Style updated successfully!' : 'Style added successfully!');
        setShowStyleModal(false);
        fetchStyles();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to save style');
      }
    } catch (err) {
      setError('Error saving style');
    }
    setLoading(false);
  };

  const handleMainCategoryChange = async (categoryId) => {
    setSelectedMainCategory(categoryId);
    setStyleForm(prev => ({
      ...prev,
      category_id: '',
      main_category_id: categoryId
    }));

    if (categoryId) {
      try {
        const response = await fetch(`${BASE_URL}/api/subcategories/${categoryId}?company_code=${company_code}`);
        const data = await response.json();
        if (data.success) {
          setSubCategories(data.subcategories);
        }
      } catch (err) {
        console.error('Error fetching subcategories:', err);
      }
    } else {
      setSubCategories([]);
    }
  };

  const getSubcategoriesForMainCategory = () => {
    return subCategories;
  };

  // Table columns definition
  const columns = useMemo(
    () => [
      {
        header: 'Images',
        accessorKey: 'image',
        maxWidth: 100,
        cell: ({ getValue }) => (
          <div className="table-images">
            {getValue() && getValue().split(',').map((img, idx) => (
              <img
                key={idx}
                src={`${BASE_URL}/uploads/styles/${img}`}
                alt={`Style ${idx + 1}`}
                className="table-thumbnail"
                title={`Click to view larger image ${idx + 1}`}
              />
            ))}
          </div>
        )
      },
      {
        header: 'Code',
        accessorKey: 'style_code',
        maxWidth: 80,
      },
      {
        header: 'Name',
        accessorKey: 'name',
        maxWidth: 150,
      },
      {
        header: 'Description',
        accessorKey: 'description',
        maxWidth: 200,
        cell: ({ getValue }) => (
          <div title={getValue()} style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {getValue()}
          </div>
        )
      },
      {
        header: 'Main Cat.',
        accessorKey: 'main_category_name',
        maxWidth: 100,
      },
      {
        header: 'Sub Cat.',
        accessorKey: 'subcategory_name',
        maxWidth: 100,
      },
     
      {
        header: 'Status',
        accessorKey: 'approved',
        maxWidth: 80,
        cell: ({ getValue }) => (
          <span className={`status-badge ${getValue() === 'yes' ? 'approved' : 'pending'}`}>
            {getValue() === 'yes' ? 'Approved' : 'Pending'}
          </span>
        )
      },
      {
        header: 'Actions',
        maxWidth: 100,
        cell: ({ row }) => (
          <div className="table-actions">
            <button
              className="action-btn edit-btn"
              onClick={() => tableActions.handleEditStyle(row.original)}
              title="Edit"
            >
              Edit
            </button>
            <button
              className="action-btn delete-btn"
              onClick={() => tableActions.handleDeleteStyle(row.original.style_id)}
              title="Delete"
            >
              Delete
            </button>
          </div>
        )
      }
    ],
    [tableActions]
  );

  // Table instance
  const table = useReactTable({
    data: styles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { 
      pagination: { pageSize: 10 }
    }
  });

  return (
    <div className="style-management">
      {/* Header */}
      <div className="style-header">
        <h1>Style Management</h1>
        <button className="add-style-btn" onClick={handleAddStyle}>
          Add New Style
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && <div className="success">{success}</div>}
      {error && <div className="error">{error}</div>}

      {/* Search Filter */}
      <div className="table-controls">
        <input
          type="text"
          placeholder="Search styles..."
          className="search-input"
          onChange={e => table.setGlobalFilter(e.target.value)}
        />
      </div>

      {/* Styles Table */}
      <div className="styles-table-container">
        {loading ? (
          <div className="loading">Loading styles...</div>
        ) : styles.length === 0 ? (
          <div className="empty-state">
            <h3>No Styles Found</h3>
            <p>Start by adding your first clothing style.</p>
            <button className="add-style-btn" onClick={handleAddStyle}>
              Add First Style
            </button>
          </div>
        ) : (
          <>
            <table className="styles-table">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th 
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <span className="sort-indicator">
                          {header.column.getIsSorted()
                            ? header.column.getIsSorted() === "desc"
                              ? " 🔽"
                              : " 🔼"
                            : ""}
                        </span>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="pagination">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </button>
              <span>
                Page{' '}
                <strong>
                  {table.getState().pagination.pageIndex + 1} of{' '}
                  {table.getPageCount()}
                </strong>
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Style Modal */}
      {showStyleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingStyle ? 'Edit Style' : 'Add New Style'}
              </h2>
              <button 
                className="close-btn"
                onClick={() => setShowStyleModal(false)}
              >
                ×
              </button>
            </div>

            {editingStyle && (
              <div className="form-group">
                <label className="form-label">Style Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingStyle.style_code}
                  disabled
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                type="text"
                className="form-input"
                value={styleForm.name}
                onChange={(e) => setStyleForm({...styleForm, name: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                value={styleForm.description}
                onChange={(e) => setStyleForm({...styleForm, description: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Main Category *</label>
              <select
                className="form-select"
                value={selectedMainCategory}
                onChange={(e) => handleMainCategoryChange(e.target.value)}
              >
                <option value="">Select Main Category</option>
                {mainCategories.map((category) => (
                  <option key={category.category_id} value={category.category_id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            {selectedMainCategory && (
              <div className="form-group">
                <label className="form-label">Sub Category *</label>
                <select
                  className="form-select"
                  value={styleForm.category_id}
                  onChange={(e) => setStyleForm({...styleForm, category_id: e.target.value})}
                >
                  <option value="">Select Sub Category</option>
                  {getSubcategoriesForMainCategory().map((subCategory) => (
                    <option key={subCategory.category_id} value={subCategory.category_id}>
                      {subCategory.category_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Images</label>
              <input
                type="file"
                className="form-input"
                accept="image/*"
                multiple
                onChange={(e) => setStyleForm({
                  ...styleForm,
                  images: Array.from(e.target.files)
                })}
              />
              {editingStyle && editingStyle.image && (
                <div className="existing-images">
                  {editingStyle.image.split(',').map((img, idx) => (
                    <img
                      key={idx}
                      src={`${BASE_URL}/uploads/styles/${img}`}
                      alt={`Existing ${idx + 1}`}
                      className="existing-thumbnail"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={styleForm.approved === 'yes'}
                  onChange={(e) => setStyleForm({
                    ...styleForm, 
                    approved: e.target.checked ? 'yes' : 'no'
                  })}
                />
                <span className="checkbox-label">Approve Style</span>
              </label>
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowStyleModal(false)}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={handleSaveStyle}
                disabled={loading || !styleForm.name || !styleForm.category_id}
              >
                {loading ? 'Saving...' : editingStyle ? 'Update Style' : 'Add Style'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}