import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  IconButton,
  Button,
  Paper,
  Box,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export default function CreateBill({ setPage, token, sheetId }) {
  const [rows, setRows] = useState([{ product: "", qty: 1, price: 0 }]);
  const [products, setProducts] = useState([]);
  const [customer, setCustomer] = useState({ name: "", phone: "" });

  // Load products from Products sheet
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Products!A:B`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        const values = data.values || [];
        const headerOffset =
          values.length && values[0][0].toLowerCase().includes("name") ? 1 : 0;
        setProducts(
          values.slice(headerOffset).map((r) => ({
            name: r[0],
            price: Number(r[1]),
          }))
        );
      } catch (err) {
        console.error("Error loading products", err);
      }
    };
    if (token) loadProducts();
  }, [token, sheetId]);

  const addRow = () => setRows([...rows, { product: "", qty: 1, price: 0 }]);
  const updateRow = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };
  const deleteRow = (index) => setRows(rows.filter((_, i) => i !== index));

  const total = rows.reduce(
    (sum, r) => sum + (Number(r.qty) || 0) * (Number(r.price) || 0),
    0
  );

  // Helper to get next bill number
  const getNextBillNumber = async () => {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Bills!A:A`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    const values = data.values || [];
    return values.length; // next bill number
  };

  const saveBill = async () => {
    if (!customer.name || !customer.phone) {
      alert("Please enter customer name and phone number.");
      return;
    }

    try {
      // Check if customer exists
      const custRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Customers!A:B`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const custData = await custRes.json();
      const custValues = custData.values || [];
      const exists = custValues.some(
        (r) => String(r[1]).trim() === String(customer.phone).trim()
      );

      // Add customer if not exists
      if (!exists) {
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Customers!A:B:append?valueInputOption=RAW`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              values: [[customer.name, customer.phone]],
            }),
          }
        );
      }

      // Get next bill number
      const billNo = await getNextBillNumber();

      // Prepare bill rows (with bill number as first column)
      const billValues = rows.map((r) => [
        billNo,
        r.product,
        r.qty,
        r.price,
        r.qty * r.price,
        customer.name,
        customer.phone,
        new Date().toISOString(),
      ]);

      // Append to Bills sheet (now A:H because of extra column)
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Bills!A:H:append?valueInputOption=RAW`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ values: billValues }),
        }
      );

      // Build WhatsApp message
      let message = `Bill #${billNo}\nCustomer: ${customer.name}\nPhone: ${customer.phone}\n\n`;
      message += "Item           Qty   Price   Amount\n";
      message += "-----------------------------------\n";
      rows.forEach((r) => {
        const amount = r.qty * r.price;
        message += `${r.product}   ${r.qty}   ₹${r.price}   ₹${amount}\n`;
      });
      message += "-----------------------------------\n";
      message += `Total: ₹${total}\n\nThank you for shopping with us!`;

      // Ensure phone number has country code (example: India = 91)
      const phoneWithCountry = customer.phone.startsWith("91")
        ? customer.phone
        : `91${customer.phone}`;

      // Open WhatsApp with pre-filled message
      const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(
        message
      )}`;
      window.open(url, "_blank");

      alert(`Bill #${billNo} saved successfully`);
      setPage("dashboard");
    } catch (err) {
      console.error("Error saving bill", err);
      alert("Error saving bill. See console for details.");
    }
  };


  return (
    <Container maxWidth="sm">
      <Typography variant="h5" gutterBottom>
        Create Bill
      </Typography>

      <TextField
        fullWidth
        size="small"
        label="Customer Name"
        sx={{ mb: 2 }}
        value={customer.name}
        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
      />
      <TextField
        fullWidth
        size="small"
        label="Phone Number"
        sx={{ mb: 2 }}
        value={customer.phone}
        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
      />

      {rows.map((row, i) => (
        <Paper key={i} sx={{ p: 1, mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Autocomplete
              freeSolo
              options={products.map((p) => p.name)}
              value={row.product}
              onChange={(e, newValue) => {
                const selected = products.find((p) => p.name === newValue);
                updateRow(i, "product", newValue || "");
                if (selected) updateRow(i, "price", selected.price);
              }}
              renderInput={(params) => (
                <TextField {...params} size="small" label="Item" sx={{ flex: 2 }} />
              )}
            />
            <TextField
              size="small"
              type="number"
              label="Qty"
              value={row.qty}
              onChange={(e) => updateRow(i, "qty", Number(e.target.value))}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              type="number"
              label="Price"
              value={row.price}
              onChange={(e) => updateRow(i, "price", Number(e.target.value))}
              sx={{ flex: 1 }}
            />
            <IconButton color="error" onClick={() => deleteRow(i)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </Paper>
      ))}

      <Button variant="outlined" onClick={addRow} sx={{ mb: 2 }}>
        + Add Item
      </Button>

      {/* Material-UI Table for Bill Preview */}
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, idx) => (
              <TableRow key={idx}>
                <TableCell>{r.product}</TableCell>
                <TableCell align="right">{r.qty}</TableCell>
                <TableCell align="right">₹{r.price}</TableCell>
                <TableCell align="right">₹{r.qty * r.price}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} align="right">
                <strong>Total</strong>
              </TableCell>
              <TableCell align="right">
                <strong>₹{total}</strong>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Button
        variant="contained"
        color="success"
        fullWidth
        sx={{ mt: 2 }}
        onClick={saveBill}
      >
        Save & Send to WhatsApp
      </Button>

      <Button
        variant="outlined"
        fullWidth
        sx={{ mt: 2 }}
        onClick={() => setPage("dashboard")}
      >
        Back to Dashboard
      </Button>
    </Container>
  );
}
