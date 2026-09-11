import React, { useState } from "react";
import Dashboard from "./components/Dashboard";
import AddProduct from "./components/AddProduct";
import ManageProducts from "./components/ManageProducts";
import CreateBill from "./components/CreateBill";
import {
  Container,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";

const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
const SHEET_ID = process.env.REACT_APP_SHEET_ID;

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [signed, setSigned] = useState(false);
  const [token, setToken] = useState(null);

  const handleSignIn = () => {
    /* global google */
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      callback: (resp) => {
        if (resp.access_token) {
          setToken(resp.access_token);
          setSigned(true);
        }
      },
    });
    client.requestAccessToken();
  };

  const handleSignOut = () => {
    setToken(null);
    setSigned(false);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 3 }}>
      {/* Header Bar */}
      <AppBar position="static" color="primary" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: "bold" }}>
            Sree Veerbadhra Stores
          </Typography>
          {signed && (
            <IconButton color="inherit" onClick={handleSignOut}>
              <LogoutIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {!signed ? (
        <>
          <Typography variant="h6" gutterBottom>
            Please sign in to manage products and bills.
          </Typography>
          <Button variant="contained" onClick={handleSignIn}>
            Sign in with Google
          </Button>
        </>
      ) : (
        <>
          {page === "dashboard" && <Dashboard setPage={setPage} />}
          {page === "addProduct" && (
            <AddProduct setPage={setPage} token={token} sheetId={SHEET_ID} />
          )}
          {page === "manageProducts" && (
            <ManageProducts setPage={setPage} token={token} sheetId={SHEET_ID} />
          )}
          {page === "createBill" && (
            <CreateBill setPage={setPage} token={token} sheetId={SHEET_ID} />
          )}
        </>
      )}
    </Container>
  );
}
