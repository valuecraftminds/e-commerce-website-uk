import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import React, { useMemo } from 'react';
import { Col, Form, Modal, Row } from 'react-bootstrap';
import { FaEdit, FaTrash } from 'react-icons/fa';
import '../styles/StyleModals.css';

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
        {editingStyle && (
          <div className="form-group col-md-6">
            <label className="form-label">Style Code</label>
            <input
              type="text"
              className="form-input"
              value={editingStyle.style_code}
              disabled
            />
          </div>
        )}

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
                  src={`${BASE_URL}/admin/uploads/styles/${img}`}
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
variantForm,
setVariantForm,
handleSaveVariant,
handleEditVariant,
handleDeleteVariant,
variants,
colors,
sizes,
materials,
fits,
isEditing,
editingId,
setIsEditing,
setEditingId
}) => {
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
      header: 'Unit price',
      accessorKey: 'unit_price',
      cell: ({ getValue }) => `$${getValue()}`
    },
    {
      header: 'Sale price',
      accessorKey: 'price',
      cell: ({ getValue }) => `$${getValue()}`
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
  [colors, sizes, fits, materials, handleDeleteVariant, setEditingId, setIsEditing, setVariantForm]
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
        {selectedStyle && `Variants for ${selectedStyle.style_code}`}
      </Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <div className="variant-form mb-4">
        <Row className="g-3 align-items-end">
          <Col md={2}>
            <Form.Group className="mb-0">
              <Form.Label className="form-label">Color *</Form.Label>
              <Form.Select
                value={variantForm.color_id}
                onChange={(e) => setVariantForm({...variantForm, color_id: e.target.value})}
                className="form-select variant-field"
              >
                <option value="">Select Color</option>
                {colors.map(color => (
                  <option key={color.color_id} value={color.color_id}>
                    {color.color_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group className="mb-0">
              <Form.Label className="form-label">Size *</Form.Label>
              <Form.Select
                value={variantForm.size_id}
                onChange={(e) => setVariantForm({...variantForm, size_id: e.target.value})}
                className="form-select variant-field"
              >
                <option value="">Select Size</option>
                {sizes.map(size => (
                  <option key={size.size_id} value={size.size_id}>
                    {size.size_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group className="mb-0">
              <Form.Label className="form-label">Fit *</Form.Label>
              <Form.Select
                value={variantForm.fit_id}
                onChange={(e) => setVariantForm({...variantForm, fit_id: e.target.value})}
                className="form-select variant-field"
              >
                <option value="">Select Fit</option>
                {fits.map(fit => (
                  <option key={fit.fit_id} value={fit.fit_id}>
                    {fit.fit_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group className="mb-0">
              <Form.Label className="form-label">Material *</Form.Label>
              <Form.Select
                value={variantForm.material_id}
                onChange={(e) => setVariantForm({...variantForm, material_id: e.target.value})}
                className="form-select variant-field"
              >
                <option value="">Select Material</option>
                {materials.map(material => (
                  <option key={material.material_id} value={material.material_id}>
                    {material.material_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group className="mb-0">
              <Form.Label className="form-label">Unit price *</Form.Label>
              <Form.Control
                type="number"
                min="0"
                value={variantForm.unit_price}
                onChange={(e) => setVariantForm({...variantForm, unit_price: Math.max(0, Number(e.target.value))})}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e') {
                    e.preventDefault();
                  }
                }}
                className="variant-field"
              />
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group className="mb-0">
              <Form.Label className="form-label">Sale price *</Form.Label>
              <Form.Control
                type="number"
                min="0"
                value={variantForm.price}
                onChange={(e) => setVariantForm({...variantForm, price: Math.max(0, Number(e.target.value))})}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e') {
                    e.preventDefault();
                  }
                }}
                className="variant-field"
              />
            </Form.Group>
          </Col>

          <Col md={isEditing ? 2 : 1}>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-primary variant-field"
                onClick={isEditing ? () => handleEditVariant(editingId) : handleSaveVariant}
                disabled={!variantForm.color_id || !variantForm.size_id || 
                         !variantForm.fit_id || !variantForm.material_id || !variantForm.unit_price || 
                         !variantForm.price}
              >
                {isEditing ? 'Update' : 'Add'}
              </button>
              {isEditing && (
                <button 
                  className="btn btn-secondary variant-field"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingId(null);
                    setVariantForm({
                      color_id: '',
                      size_id: '',
                      fit_id: '',
                      material_id: '',
                      unit_price: '',
                      price: '',
                    });
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </Col>
        </Row>
      </div>

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

