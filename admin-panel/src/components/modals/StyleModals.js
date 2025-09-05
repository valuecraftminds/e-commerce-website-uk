import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import { useMemo, useState, useEffect } from 'react';
import {  Modal, Row } from 'react-bootstrap';
import { FaEdit, FaTrash } from 'react-icons/fa';
import '../../styles/StyleModals.css';

// Function to validate image aspect ratio (height:width = 3:2) and file size
const validateImageRatio = (file) => {
  return new Promise((resolve) => {
    // Check file size first (2MB = 2 * 1024 * 1024 bytes)
    const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
    const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    
    if (file.size > maxSizeInBytes) {
      resolve({
        isValid: false,
        error: `File size too large (${fileSizeInMB}MB). Maximum allowed: 2MB`,
        fileName: file.name,
        fileSize: fileSizeInMB
      });
      return;
    }

    const img = new Image();
    img.onload = () => {
      const actualRatio = img.width / img.height; // width:height ratio
      const expectedRatio = 2 / 3; // width:height = 2:3 = 0.667 (since height:width = 3:2)
      const tolerance = 0.05; // Allow small tolerance for rounding
      
      const isValidRatio = Math.abs(actualRatio - expectedRatio) <= tolerance;
      resolve({
        isValid: isValidRatio,
        actualRatio: actualRatio,
        expectedRatio: expectedRatio,
        width: img.width,
        height: img.height,
        fileName: file.name,
        fileSize: fileSizeInMB,
        heightToWidthRatio: img.height / img.width // For display purposes
      });
    };
    img.onerror = () => {
      resolve({
        isValid: false,
        error: 'Failed to load image',
        fileName: file.name,
        fileSize: fileSizeInMB
      });
    };
    img.src = URL.createObjectURL(file);
  });
};

export const StyleFormModal = ({ 
show, 
onHide, 
editingStyle, 
styleForm, 
setStyleForm, 
selectedMainCategory,
handleMainCategoryChange,
mainCategories,
getSubcategoriesForMainCategory,
handleSaveStyle,
loading,
BASE_URL
}) => {
  const [imageValidationError, setImageValidationError] = useState('');
  const [isValidatingImages, setIsValidatingImages] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);

  // Clean up object URLs when component unmounts or images change
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Clean up URLs when modal closes
  useEffect(() => {
    if (!show) {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      setImageValidationError('');
      setIsValidatingImages(false);
    }
  }, [show, previewUrls]);

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) {
      // Clean up previous URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      return;
    }

    setIsValidatingImages(true);
    setImageValidationError('');

    // Clean up previous URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));

    try {
      const validationResults = await Promise.all(
        files.map(file => validateImageRatio(file))
      );

      const invalidImages = validationResults.filter(result => !result.isValid);

      if (invalidImages.length > 0) {
        const errorMessages = invalidImages.map(result => {
          if (result.error) {
            return `${result.fileName} (${result.fileSize}MB): ${result.error}`;
          }
          return `${result.fileName} (${result.fileSize}MB): Invalid aspect ratio (H:W = ${result.heightToWidthRatio.toFixed(2)}:1). Required: height:width = 3:2`;
        });
        
        setImageValidationError(`Please upload images with height:width = 3:2 aspect ratio and max 2MB size:\n${errorMessages.join('\n')}`);
        e.target.value = ''; // Clear the file input
        setPreviewUrls([]);
        setIsValidatingImages(false);
        return;
      }

      // All images are valid - create preview URLs
      const newPreviewUrls = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(newPreviewUrls);
      
      setStyleForm({
        ...styleForm,
        images: files
      });
    } catch (error) {
      setImageValidationError('Error validating images. Please try again.');
      e.target.value = '';
      setPreviewUrls([]);
    }
    
    setIsValidatingImages(false);
  };

  return (
<Modal show={show} onHide={onHide} size="large" >
  <Modal.Header closeButton>
    <Modal.Title>
      {editingStyle ? 'Edit Style' : 'Add New Style'}
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Row>
        <div className="form-group col-md-6">
          <label className="form-label">Style Number *</label>
          <input
            type="text"
            className="form-input"
            value={styleForm.style_number}
            onChange={(e) => setStyleForm({...styleForm, style_number: e.target.value})}
            // disabled={!!editingStyle}
          />
        </div>
        <div className="form-group col-md-6">
          <label className="form-label">Name *</label>
          <input
            type="text"
            className="form-input"
            value={styleForm.name}
            onChange={(e) => setStyleForm({...styleForm, name: e.target.value})}
          />
        </div>

        <div className="form-group col-md-12">
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            value={styleForm.description}
            onChange={(e) => setStyleForm({...styleForm, description: e.target.value})}
          />
        </div>

        <div className="form-group col-md-6">
          <label className="form-label">Main Category *</label>
          <select
            className="form-select"
            value={selectedMainCategory || (editingStyle && editingStyle.main_category_id ? editingStyle.main_category_id.toString() : '')}
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

        {(selectedMainCategory || (editingStyle && editingStyle.main_category_id)) && (
          <div className="form-group col-md-6">
            <label className="form-label">Sub Category *</label>
            <select
              className="form-select"
              value={styleForm.category_id || (editingStyle && editingStyle.category_id ? editingStyle.category_id.toString() : '')}
              onChange={(e) => setStyleForm({...styleForm, category_id: e.target.value})}
            >
              <option value="">Select Sub Category</option>
              {(() => {
                // Determine which main category to use for subcategories
                const mainCatId = selectedMainCategory || (editingStyle && editingStyle.main_category_id ? editingStyle.main_category_id.toString() : '');
                const subCats = mainCatId ? getSubcategoriesForMainCategory(mainCatId) : [];
                return subCats.map((subCategory) => (
                  <option key={subCategory.category_id} value={subCategory.category_id}>
                    {subCategory.category_name}
                  </option>
                ));
              })()}
            </select>
          </div>
        )}

        <div className="form-group col-md-12">
          <label className="form-label">Images</label>
          <div className="image-upload-note">
            <small className="text-muted">
              📸 Please upload images with height:width ratio of 3:2 (e.g., 300x200px, 600x400px) and maximum file size of 2MB
            </small>
          </div>
          <input
            type="file"
            className="form-input"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            disabled={isValidatingImages}
          />
          {isValidatingImages && (
            <div className="validation-message validating">
              Validating image aspect ratios...
            </div>
          )}
          {imageValidationError && (
            <div className="validation-message error">
              {imageValidationError.split('\n').map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          )}
          {!imageValidationError && !isValidatingImages && styleForm.images && styleForm.images.length > 0 && (
            <div className="validation-message success">
              ✓ {styleForm.images.length} image(s) validated with correct height:width = 3:2 aspect ratio and file size ≤ 2MB
            </div>
          )}
          
          {/* Preview of newly selected images */}
          {styleForm.images && styleForm.images.length > 0 && previewUrls.length > 0 && (
            <div className="new-images-preview">
              <p className="preview-label">Selected Images:</p>
              <div className="image-previews">
                {styleForm.images.map((file, idx) => (
                  <div key={idx} className="image-preview-item">
                    <img
                      src={previewUrls[idx]}
                      alt={`Preview ${idx + 1}`}
                      className="preview-thumbnail"
                    />
                    <span className="image-name">{file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {editingStyle && editingStyle.image && (
            <div className="existing-images">
              <p className="existing-label">Existing Images:</p>
              <div className="image-previews">
                {editingStyle.image.split(',').map((img, idx) => (
                  <div key={idx} className="image-preview-item">
                    <img
                      src={`${BASE_URL}/uploads/styles/${img.trim()}`}
                      alt={`Existing ${idx + 1}`}
                      className="existing-thumbnail"
                    />
                    <span className="image-name">{img.trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="form-group col-md-12">
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
    </Row>
  </Modal.Body>
  <Modal.Footer>
    <button className="cancel-btn" onClick={onHide}>
      Cancel
    </button>
    <button 
      className="save-btn"
      onClick={handleSaveStyle}
      disabled={loading || !styleForm.name || !styleForm.category_id}
    >
      {loading ? 'Saving...' : editingStyle ? 'Update Style' : 'Add Style'}
    </button>
  </Modal.Footer>
</Modal>
);
};

export const VariantFormModal = ({
  show,
  onHide,
  selectedStyle,
  setVariantForm,
  handleDeleteVariant,
  variants,
  colors,
  sizes,
  materials,
  fits,
  setIsEditing,
  setEditingId,
  companyCurrency
}) => {
  // Use companyCurrency for table headings
  const currency = companyCurrency || 'USD';
  const columns = useMemo(
    () => [
      {
        header: 'SKU',
        accessorKey: 'sku',
      },
      {
        header: 'Color',
        accessorFn: row => colors.find(c => c.color_id === row.color_id)?.color_name || '',
        cell: ({ row }) => {
          const color = colors.find(c => c.color_id === row.original.color_id);
          return (
            <div className="d-flex align-items-center gap-2">
              <span 
                className="color-swatch"
                style={{ 
                  backgroundColor: color?.color_code || '#fff',
                  border: '1px solid #dee2e6'
                }}
              />
              <span>{color?.color_name || ''}</span>
            </div>
          );
        }
      },
      {
        header: 'Size',
        accessorFn: row => sizes.find(s => s.size_id === row.size_id)?.size_name || '',
      },
      {
        header: 'Fit',
        accessorFn: row => fits.find(f => f.fit_id === row.fit_id)?.fit_name || '',
      },
      {
        header: 'Material',
        accessorFn: row => materials.find(m => m.material_id === row.material_id)?.material_name || '',
      },
      {
        header: `Unit price (${currency})`,
        accessorKey: 'unit_price',
        cell: ({ getValue }) => `${getValue()}`
      },
      {
        header: `Sale price (${currency})`,
        accessorKey: 'sale_price',
        cell: ({ getValue }) => `${getValue()}`
      },
      {
        header: 'Status',
        accessorKey: 'is_active',
        cell: ({ getValue }) => (
          <span className={`status-badge ${getValue() ? 'approved' : 'pending'}`}>
            {getValue() ? 'Active' : 'Inactive'}
          </span>
        )
      },
      // {
      //   header: 'Actions',
      //   cell: ({ row }) => (
      //     <div className="table-actions">
      //       <button
      //         className="action-btn edit-btn"
      //         onClick={() => {
      //           setIsEditing(true);
      //           setEditingId(row.original.variant_id);
      //           setVariantForm({
      //             color_id: row.original.color_id,
      //             size_id: row.original.size_id,
      //             fit_id: row.original.fit_id,
      //             material_id: row.original.material_id,
      //             unit_price: row.original.unit_price,
      //             price: row.original.price
      //           });
      //         }}
      //       >
      //         <FaEdit size={14} />
      //       </button>
      //       <button
      //         className="action-btn delete-btn"
      //         onClick={() => handleDeleteVariant(row.original.variant_id)}
      //       >
      //         <FaTrash size={14} />
      //       </button>
      //     </div>
      //   )
      // }
    ],
    [colors, sizes, fits, materials, handleDeleteVariant, setEditingId, setIsEditing, setVariantForm, currency]
  );

const table = useReactTable({
  data: variants,
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
  <Modal show={show} onHide={onHide} size="xl">
    <Modal.Header closeButton>
      <Modal.Title>
        {selectedStyle && `Variants for ${selectedStyle.style_number}`}
      </Modal.Title>
    </Modal.Header>
    <Modal.Body>
     

      <div className="variants-table-container">
        <div className="table-controls">
          <input
            type="text"
            placeholder="Search variants..."
            className="search-input"
            onChange={e => table.setGlobalFilter(e.target.value)}
          />
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className="page-size-select"
          >
            {[10, 25, 50].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>

        <div className="table-responsive">
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
        </div>

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
      </div>
    </Modal.Body>
  </Modal>
);
};

