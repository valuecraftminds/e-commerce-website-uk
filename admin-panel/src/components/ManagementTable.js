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
      <Button variant="secondary" className='mb-4' onClick={() => window.history.back()}>
            Back
          </Button>
      <Card className="mb-4">
        <Card.Header>
          <h3>{isEditing ? `Edit ${title}` : `Add New ${title}`}</h3>
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
                        [field]: e.target.value
                      })}
                      required
                    />
                  </Form.Group>
                </div>
              ))}
            </div>
            <div className="d-flex gap-2">
              <Button type="submit" variant="primary" disabled={loading}>
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
          <h3>{title} List</h3>
          
        </Card.Header>
        <Card.Body>
          <Table responsive striped bordered hover>
            <thead>
              <tr>
                {columns.map(column => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  {columns.map(column => (
                    <td key={column.key}>{item[column.key]}</td>
                  ))}
                  <td>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="info" 
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <FaEdit />
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm"
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
