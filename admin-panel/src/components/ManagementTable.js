import { Button, Card, Form, Table } from 'react-bootstrap';
import { FaEdit, FaTrash } from 'react-icons/fa';


const ManagementTable = ({ 
  title,
  items,
  columns,
  formData,
  setFormData,
  handleSubmit,
  handleEdit,
  handleDelete,
  isEditing,
  loading,
  error,
  success,
  onCancel
}) => {

  return (
    <div className="management-container">
 
      <Card className="mb-4">
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

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5>{title} List</h5>
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
                    <div className="d-flex gap-2">
                      <Button 
                        variant="info" 
                        size="sm"
                        className="py-0 px-2"
                        style={{ fontSize: '0.9rem', lineHeight: 1 }}
                        onClick={() => handleEdit(item)}
                      >
                        <FaEdit />
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm"
                        className="py-0 px-2"
                        style={{ fontSize: '0.9rem', lineHeight: 1 }}
                        onClick={() => {
                          // Get the correct ID based on the type of item
                          const itemId = item.color_id || item.size_id || item.material_id || item.fit_id;
                          handleDelete(itemId);
                        }}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ManagementTable;
