import React, { useState } from "react";
import { Container, Typography, TextField, Button } from "@mui/material";

export default function AddProduct({ setPage, token, sheetId }) {
  const [product, setProduct] = useState({ name: "", price: "" });

  const saveProduct = async () => {
    if (!product.name || !product.price) return alert("Enter name and price");
    try {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Products!A:B:append?valueInputOption=RAW`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ values: [[product.name, product.price]] }),
        }
      );
      alert("Product saved!");
      setPage("dashboard");
    } catch (err) {
      console.error(err);
      alert("Error saving product");
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h5" gutterBottom>
        Add Product
      </Typography>
      <TextField
        fullWidth
        label="Product Name"
        size="small"
        sx={{ mb: 2 }}
        value={product.name}
        onChange={(e) => setProduct({ ...product, name: e.target.value })}
      />
      <TextField
        fullWidth
        label="Price"
        type="number"
        size="small"
        sx={{ mb: 2 }}
        value={product.price}
        onChange={(e) => setProduct({ ...product, price: e.target.value })}
      />
      <Button
        variant="contained"
        color="success"
        fullWidth
        sx={{ mb: 2 }}
        onClick={saveProduct}
      >
        Save Product
      </Button>
      <Button variant="outlined" fullWidth onClick={() => setPage("dashboard")}>
        Back to Dashboard
      </Button>
    </Container>
  );
}
