import { Button, Card, Form, Table } from 'react-bootstrap';
import { FaEdit, FaTrash } from 'react-icons/fa';

import '../styles/StyleAttributeTable.css';

const StyleAttributeTable = ({ 
  title,
  items,
  columns,
  formData,
  setFormData,
  handleSubmit,
  handleEdit,
  isEditing,
  loading,
  error,
  success,
  onCancel
}) => {


  return (
    <div className="management-container">
      <Card className="mb-4 add-style-attribute">
        <Card.Header>
          <h5>{isEditing ? `Edit ${title}` : `Add New ${title}`}</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <div className="row">
              {Object.keys(formData).map(field => (
                <div className="col-md-6 mb-3" key={field}> 
                  <Form.Group>
                    <Form.Label>{field.replace('_', ' ').toUpperCase()}</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData[field]}
                      onChange={(e) => setFormData({
                        ...formData,
                        [field]: e.target.value.toUpperCase()
                      })}
                      required
                    />
                  </Form.Group>
                </div>
              ))}
            </div>
            <div className="d-flex gap-2">
              <Button type="submit" variant="primary" disabled={loading} className='add-style-btn'>
                {loading ? 'Saving...' : isEditing ? 'Update' : 'Add'}
              </Button>
              {isEditing && (
                <Button variant="secondary" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </Form>
        </Card.Body>
      </Card>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <Card className='general-list'>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5>General {title} List</h5>
        </Card.Header>
        <Card.Body>
          <Table responsive striped bordered hover size="sm" className="table-organized">
            <thead>
              <tr style={{ verticalAlign: 'middle' }}>
                {columns.map(column => (
                  <th key={column.key} style={{ minWidth: '100px' }}>{column.label}</th>
                ))}
                <th style={{ width: '90px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{ verticalAlign: 'middle', height: '34px' }}>
                  {columns.map(column => (
                    <td key={column.key} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item[column.key]}</td>
                  ))}
                  <td>
                    <FaEdit 
                      className="action-icon me-2 text-warning"
                      onClick={() => handleEdit(item)}
                      title="Edit Item"
                      style={{ cursor: 'pointer' }}
                      size={16}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/*
      Delete Modal (single instance, controlled by state)
      <DeleteModal
        id={deleteModalId}
        show={!!deleteModalId}
        onHide={() => setDeleteModalId(null)}
        deleteUrl={(id) => {
          if (itemToDelete && itemToDelete.deleteUrl) {
            if (typeof itemToDelete.deleteUrl === 'function') return itemToDelete.deleteUrl(id);
            if (typeof itemToDelete.deleteUrl === 'string' && itemToDelete.deleteUrl.includes(':id')) return itemToDelete.deleteUrl.replace(':id', id);
            return itemToDelete.deleteUrl;
          }
          // fallback: try to infer entity type
          if (itemToDelete && itemToDelete.color_id) return `/api/admin/colors/delete-colors/${id}`;
          if (itemToDelete && itemToDelete.size_id) return `/api/admin/sizes/delete-sizes/${id}`;
          if (itemToDelete && itemToDelete.material_id) return `/api/admin/materials/delete-materials/${id}`;
          if (itemToDelete && itemToDelete.fit_id) return `/api/admin/fits/delete-fits/${id}`;
          return `/api/admin/auth/delete-admin/${id}`;
        }}
        entityLabel={title.toLowerCase()}
        onDeleteSuccess={handleDeleteSuccess}
      />
      */}
    </div>
  );
};

export default StyleAttributeTable;
