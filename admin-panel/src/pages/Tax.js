import { Button, Form, Table, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import { useEffect, useState, useContext, useCallback } from "react";
import { FiEdit3 } from "react-icons/fi";


import { AuthContext } from '../context/AuthContext';
import "../styles/Tax.css";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function Tax() {
  const { userData } = useContext(AuthContext);
  const [taxData, setTaxData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ country: "", tax_rate: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [tax_id, setTaxId] = useState(null);

  // Fetch taxes
  const getTaxes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/tax/get`, {
        params: { 
            company_code: userData?.company_code
        }
      });
      setTaxData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch taxes");
    } finally {
      setLoading(false);
    }
  }, [userData]);

  // Add or update tax
  const addUpdateTax = async (e) => {
    if (e) e.preventDefault();
    setAddLoading(true);
    setAddError("");
    setAddSuccess("");
    try {
      if (editMode && tax_id != null) {
        // Update tax
        await axios.put(`${BASE_URL}/api/admin/tax/update/${tax_id}`, {
          company_code: userData?.company_code,
          country: form.country,
          tax_rate: parseFloat(form.tax_rate),
        });
        setAddSuccess("Tax updated successfully");
      } else {
        // Add tax
        await axios.post(`${BASE_URL}/api/admin/tax/add`, {
          company_code: userData?.company_code,
          country: form.country,
          tax_rate: parseFloat(form.tax_rate),
        });
        setAddSuccess("Tax added successfully");
      }
      setForm({ country: "", tax_rate: "" });
      setEditMode(false);
      setTaxId(null);
      getTaxes();
    } catch (err) {
      setAddError(err.response?.data?.error || (editMode ? "Failed to update tax" : "Failed to add tax"));
    } finally {
      setAddLoading(false);
    }
  };

  useEffect(() => {
    getTaxes();
  }, [getTaxes]);

  // Hide success/error messages after a delay
  useEffect(() => {
    let timer;
    if (addSuccess || addError) {
      timer = setTimeout(() => {
        setAddSuccess("");
        setAddError("");
      }, 1500); 
    }
    return () => clearTimeout(timer);
  }, [addSuccess, addError]);

  return (
    <>
        <Form className="tax-form" onSubmit={addUpdateTax}>
            <Form.Group>
                <Form.Label>Select Country</Form.Label>
                <Form.Control
                    type="text"
                    placeholder="Enter country name"
                    value={form.country}
                    onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                    required
                />
            </Form.Group>

            <Form.Group>
                <Form.Label>Tax Rate (%)</Form.Label>
                <Form.Control
                    type="number"
                    placeholder="Enter tax rate"
                    value={form.tax_rate}
                    onChange={e => setForm(f => ({ ...f, tax_rate: e.target.value }))}
                    required
                    min={0}
                    step="0.01"
                />
            </Form.Group>

            <Button variant="primary" type="submit" disabled={addLoading}>
                {addLoading ? <Spinner size="sm" animation="border" /> : (editMode ? "Update Tax" : "Add Tax")}
            </Button>

            {editMode && (
                <Button variant="secondary" className="ms-2" onClick={() => { setEditMode(false); setTaxId(null); setForm({ country: "", tax_rate: "" }); }}>
                    Cancel
                </Button>
            )}
            {addError && <Alert variant="danger" className="mt-2">{addError}</Alert>}
            {addSuccess && <Alert variant="success" className="mt-2">{addSuccess}</Alert>}
        </Form>

        {/* Table to display existing countries and tax rates */}
        <h4 className="tax-title">Existing Countries and Tax Rates</h4>
            {loading ? (
                <div className="text-center my-4"><Spinner animation="border" /></div>
            ) : error ? (
                <Alert variant="danger" className="my-4">{error}</Alert>
            ) : (
                <Table striped bordered hover className="tax-table mt-2">
                    <thead>
                        <tr>
                            <th>Country</th>
                            <th>Tax Rate (%)</th>
                            <th>Update</th>
                        </tr>
                    </thead>
                    <tbody>
                        {taxData.map((row, idx) => (
                            <tr key={idx}>
                                <td>{row.country}</td>
                                <td>{row.tax_rate}</td>
                                <td>
                                    <Button 
                                        variant="primary" 
                                        size="sm" 
                                        className="tax-update-btn" 
                                        onClick={() => {
                                        setForm({ country: row.country, tax_rate: row.tax_rate });
                                        setEditMode(true);
                                        setTaxId(row.tax_id);
                                        }}
                                    >
                                        <FiEdit3 />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
    </>
  );
};