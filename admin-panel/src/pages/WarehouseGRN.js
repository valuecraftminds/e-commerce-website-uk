import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Card, Col, Container, Form, Row } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import '../styles/WarehouseGRN.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function WarehouseGRN() {
  const [grnData, setGrnData] = useState({
    style_code: '',
    sku: '',
    quantity_in: '',
    location: ''
  });
  const [grnList, setGrnList] = useState([]);
  const [styles, setStyles] = useState([]);
  const [variants, setVariants] = useState([]);
  const { userData } = useContext(AuthContext);

  const company_code = userData?.company_code;
  const user_id = userData?.id; 

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchStyles = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin/api/get-styles?company_code=${company_code}`);
      const data = await response.json();
      if (data.success) {
        setStyles(data.styles);
      } else {
        setError(data.message || 'Failed to fetch styles');
      }
    } catch (error) {
      setError('Error fetching styles');
    }
  }, [company_code]);

  const fetchVariants = async (styleCode) => {
    try {
      const response = await fetch(`${BASE_URL}/admin/api/get-style-variants/${styleCode}`);
      const data = await response.json();
      if (data.success) {
        setVariants(data.variants);
      } else {
        setError(data.message || 'Failed to fetch variants');
      }
    } catch (error) {
      setError('Error fetching variants');
    }
  };

  const fetchGRNList = useCallback(async () => {
    try {
        const response = await fetch(`${BASE_URL}/admin/api/get-grn?company_code=${company_code}`);
        const data = await response.json();
        if (data.success) {
          setGrnList(data.grn);
        } else {
          setError(data.message || 'Failed to fetch GRN list');
        }
      } catch (error) {
        setError('Error fetching GRN list');
      }
    }, [company_code]);

  useEffect(() => {
    fetchStyles();
    fetchGRNList();
  }, [fetchStyles, fetchGRNList]);

  const handleStyleChange = (e) => {
    const styleCode = e.target.value;
    setGrnData({ ...grnData, style_code: styleCode, sku: '' });
    if (styleCode) {
      fetchVariants(styleCode);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(`${BASE_URL}/admin/api/add-grn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...grnData,
          company_code: company_code,
          warehouse_user_id: user_id
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('GRN added successfully');
        setGrnData({
          style_code: '',
          sku: '',
          quantity_in: '',
          location: ''
        });
        fetchGRNList();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to add GRN');
      }
    } catch (error) {
      setError('Error adding GRN');
    }
  };

  const columns = useMemo(
    () => [
      {
        header: 'GRN ID',
        accessorKey: 'grn_id',
      },
      {
        header: 'Style Code',
        accessorKey: 'style_code',
      },
      {
        header: 'SKU',
        accessorKey: 'sku',
      },
      {
        header: 'Quantity',
        accessorKey: 'quantity_in',
      },
      {
        header: 'Location',
        accessorKey: 'location',
      },
      {
        header: 'Date',
        accessorKey: 'received_date',
        cell: ({ getValue }) => new Date(getValue()).toLocaleDateString(),
      },
    ],
    []
  );

  const table = useReactTable({
    data: grnList,
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
    <Container fluid >
      {success && <div className="success">{success}</div>}
      {error && <div className="error">{error}</div>}

      <Card className="mb-4">
     
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col lg={3} md={6}>
                <Form.Group>
                  <Form.Label>Style Code</Form.Label>
                  <Form.Select
                    value={grnData.style_code}
                    onChange={handleStyleChange}
                    required
                  >
                    <option value="">Select Style</option>
                    {styles.map(style => (
                      <option key={style.style_code} value={style.style_code}>
                        {style.style_code} - {style.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col lg={3} md={6}>
                <Form.Group>
                  <Form.Label>SKU</Form.Label>
                  <Form.Select
                    value={grnData.sku}
                    onChange={(e) => setGrnData({ ...grnData, sku: e.target.value })}
                    required
                  >
                    <option value="">Select SKU</option>
                    {variants.map(variant => (
                      <option key={variant.sku} value={variant.sku}>
                        {variant.sku}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col lg={2} md={6}>
                <Form.Group>
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    value={grnData.quantity_in}
                    onChange={(e) => setGrnData({ ...grnData, quantity_in: e.target.value })}
                    required
                    min="1"
                  />
                </Form.Group>
              </Col>

              <Col lg={2} md={6}>
                <Form.Group>
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    value={grnData.location}
                    onChange={(e) => setGrnData({ ...grnData, location: e.target.value })}
                    required
                    placeholder="Enter location"
                  />
                </Form.Group>
              </Col>

              <Col lg={2} md={12} className="d-flex align-items-end">
                <button type="submit" className="btn btn-primary w-100">
                  Add GRN
                </button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Card>
       
        <Card.Body>
          <div className="table-controls">
            <input
              type="text"
              placeholder="Search GRN..."
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
                        {header.column.getIsSorted() && (
                          <span className="sort-indicator">
                            {header.column.getIsSorted() === "desc" ? " 🔽" : " 🔼"}
                          </span>
                        )}
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
        </Card.Body>
      </Card>
    </Container>
  );
}