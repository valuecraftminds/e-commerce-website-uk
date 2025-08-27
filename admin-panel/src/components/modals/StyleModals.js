import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import { useMemo } from 'react';
import {  Modal, Row } from 'react-bootstrap';
import { FaEdit, FaTrash } from 'react-icons/fa';
import '../../styles/StyleModals.css';

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
}) => (
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
          <div className="form-group col-md-6">
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

        <div className="form-group col-md-12">
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
                  src={`${BASE_URL}/uploads/styles/${img.trim()}`}
                  alt={`Existing ${idx + 1}`}
                  className="existing-thumbnail"
                />
              ))}
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
      {
        header: 'Actions',
        cell: ({ row }) => (
          <div className="table-actions">
            <button
              className="action-btn edit-btn"
              onClick={() => {
                setIsEditing(true);
                setEditingId(row.original.variant_id);
                setVariantForm({
                  color_id: row.original.color_id,
                  size_id: row.original.size_id,
                  fit_id: row.original.fit_id,
                  material_id: row.original.material_id,
                  unit_price: row.original.unit_price,
                  price: row.original.price
                });
              }}
            >
              <FaEdit size={14} />
            </button>
            <button
              className="action-btn delete-btn"
              onClick={() => handleDeleteVariant(row.original.variant_id)}
            >
              <FaTrash size={14} />
            </button>
          </div>
        )
      }
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

