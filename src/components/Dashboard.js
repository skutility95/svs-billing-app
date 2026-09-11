import React from "react";
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ReceiptIcon from "@mui/icons-material/Receipt";

export default function Dashboard({ setPage }) {
  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Card elevation={3}>
        <CardContent>
          <Typography
            variant="h4"
            gutterBottom
            align="center"
            sx={{ fontWeight: "bold", mb: 3 }}
          >
            Dashboard
          </Typography>

          <Stack spacing={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddCircleIcon />}
              onClick={() => setPage("addProduct")}
            >
              Add Product
            </Button>

            <Button
              variant="contained"
              color="secondary"
              startIcon={<ListAltIcon />}
              onClick={() => setPage("manageProducts")}
            >
              Manage Products
            </Button>

            <Button
              variant="contained"
              color="success"
              startIcon={<ReceiptIcon />}
              onClick={() => setPage("createBill")}
            >
              Create Bill
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
