import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  IconButton,
  Paper,
  Box,
  AppBar,
  Toolbar,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";

export default function ManageProducts({ setPage, token, sheetId }) {
  const [products, setProducts] = useState([]);

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
          price: r[1],
        }))
      );
    } catch (err) {
      console.error(err);
      alert("Error loading products");
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Products!A:B`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      const values = data.values || [];
      const headerOffset =
        values.length && values[0][0].toLowerCase().includes("name") ? 1 : 0;
      const matchIndex = values.findIndex(
        (r, i) =>
          i >= headerOffset &&
          r[0] === product.name &&
          Number(r[1]) === Number(product.price)
      );
      if (matchIndex === -1) throw new Error("Product not found");

      const meta = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const metaJson = await meta.json();
      const sheet = metaJson.sheets.find(
        (s) => s.properties.title === "Products"
      );
      const sheetIdNum = sheet.properties.sheetId;

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: sheetIdNum,
                    dimension: "ROWS",
                    startIndex: matchIndex,
                    endIndex: matchIndex + 1,
                  },
                },
              },
            ],
          }),
        }
      );
      alert("Product deleted");
      loadProducts();
    } catch (err) {
      console.error(err);
      alert("Error deleting product");
    }
  };

  const updateProduct = async (oldProduct, newProduct) => {
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Products!A:B`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      const values = data.values || [];
      const headerOffset =
        values.length && values[0][0].toLowerCase().includes("name") ? 1 : 0;
      const matchIndex = values.findIndex(
        (r, i) =>
          i >= headerOffset &&
          r[0] === oldProduct.name &&
          Number(r[1]) === Number(oldProduct.price)
      );
      if (matchIndex === -1) throw new Error("Product not found");

      const meta = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const metaJson = await meta.json();
      const sheet = metaJson.sheets.find(
        (s) => s.properties.title === "Products"
      );
      const sheetIdNum = sheet.properties.sheetId;

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: [
              {
                updateCells: {
                  range: {
                    sheetId: sheetIdNum,
                    startRowIndex: matchIndex,
                    endRowIndex: matchIndex + 1,
                    startColumnIndex: 0,
                    endColumnIndex: 2,
                  },
                  rows: [
                    {
                      values: [
                        { userEnteredValue: { stringValue: newProduct.name } },
                        {
                          userEnteredValue: {
                            numberValue: Number(newProduct.price),
                          },
                        },
                      ],
                    },
                  ],
                  fields: "userEnteredValue",
                },
              },
            ],
          }),
        }
      );
      alert("Product updated");
      loadProducts();
    } catch (err) {
      console.error(err);
      alert("Error updating product");
    }
  };

  return (
    <Container maxWidth="sm">
      {/* Top AppBar with Back button */}
      <AppBar position="static" color="default" elevation={1} sx={{ mb: 2 }}>
        <Toolbar>
          <IconButton edge="start" color="primary" onClick={() => setPage("dashboard")}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Manage Products
          </Typography>
        </Toolbar>
      </AppBar>

      {products.length === 0 ? (
        <Typography>No products available.</Typography>
      ) : (
        products.map((p, i) => (
          <Paper key={i} sx={{ p: 1, mb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ flex: 2 }}>{p.name}</Typography>
              <Typography sx={{ flex: 1 }}>₹{p.price}</Typography>
              <IconButton
                color="primary"
                onClick={() => {
                  const newName = prompt("Enter new name", p.name);
                  const newPrice = prompt("Enter new price", p.price);
                  if (newName && newPrice) {
                    updateProduct(p, { name: newName, price: newPrice });
                  }
                }}
              >
                <EditIcon />
              </IconButton>
              <IconButton color="error" onClick={() => deleteProduct(p)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          </Paper>
        ))
      )}
    </Container>
  );
}
