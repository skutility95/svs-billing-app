// src/api/sheets.js
import { gapi } from "gapi-script";

const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
const API_KEY = process.env.REACT_APP_API_KEY;
export const SHEET_ID = process.env.REACT_APP_SHEET_ID; // export if needed elsewhere

export async function initGapi() {
  return new Promise((resolve, reject) => {
    gapi.load("client:auth2", async () => {
      try {
        await gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES,
        });
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
}

export function isSignedIn() {
  const auth = gapi.auth2.getAuthInstance();
  return auth && auth.isSignedIn.get();
}

export function signIn() {
  const auth = gapi.auth2.getAuthInstance();
  return auth.signIn();
}

export function signOut() {
  const auth = gapi.auth2.getAuthInstance();
  return auth.signOut();
}

export function getAccessToken() {
  const user = gapi.auth2.getAuthInstance().currentUser.get();
  return user.getAuthResponse(true).access_token;
}

/* -------------------------
   Products helpers (existing)
   ------------------------- */

export async function fetchProducts() {
  const res = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Products!A:B",
  });
  const values = res.result.values || [];
  const headerOffset = values.length && values[0][0] && values[0][0].toLowerCase().includes("name") ? 1 : 0;
  return values.slice(headerOffset).map((r) => ({ name: r[0] || "", price: Number(r[1] || 0) }));
}

export async function addProduct(product) {
  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Products!A:B",
    valueInputOption: "RAW",
    resource: { values: [[product.name, product.price]] },
  });
}

/* -------------------------
   Customers helpers (new)
   ------------------------- */

/**
 * Read Customers sheet and return array of { name, phone }.
 * If Customers sheet doesn't exist or is empty, returns [].
 */
export async function fetchCustomers() {
  try {
    const res = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Customers!A:B",
    });
    const values = res.result.values || [];
    const headerOffset = values.length && values[0][0] && values[0][0].toLowerCase().includes("name") ? 1 : 0;
    return values.slice(headerOffset).map((r) => ({ name: r[0] || "", phone: String(r[1] || "") }));
  } catch (e) {
    // If sheet missing or other error, return empty list
    return [];
  }
}

/**
 * Returns true if a customer with the given phone exists.
 * Phone comparison is done as string equality after trimming.
 */
export async function checkCustomerExists(phone) {
  if (!phone) return false;
  const customers = await fetchCustomers();
  const normalized = String(phone).trim();
  return customers.some((c) => String(c.phone).trim() === normalized);
}

/**
 * Append a customer to Customers sheet only if not already present.
 * Returns { added: boolean }.
 */
export async function addCustomerIfNotExists(customer) {
  const phone = String(customer.phone || "").trim();
  if (!phone) throw new Error("Customer phone required");
  const exists = await checkCustomerExists(phone);
  if (exists) return { added: false };

  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Customers!A:B",
    valueInputOption: "RAW",
    resource: { values: [[customer.name || "", phone]] },
  });
  return { added: true };
}

/* -------------------------
   Bills helpers (updated)
   ------------------------- */

/**
 * Append bill rows to Bills sheet.
 * billRows: [{ product, qty, price, amount }]
 * customer: { name, phone }
 */
export async function appendBill(billRows, customer) {
  if (!Array.isArray(billRows) || billRows.length === 0) throw new Error("No bill rows");
  const values = billRows.map((r) => [
    r.product || "",
    r.qty || 0,
    r.price || 0,
    r.amount || 0,
    customer.name || "",
    String(customer.phone || ""),
    new Date().toISOString(),
  ]);
  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Bills!A:G",
    valueInputOption: "RAW",
    resource: { values },
  });
}

// Delete a product row by matching name+price (deletes first match)
export async function deleteProductRow(product) {
  // Fetch all rows from Products sheet
  const res = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Products!A:B",
  });
  const values = res.result.values || [];

  // Skip header row if present
  const headerOffset =
    values.length &&
    values[0][0] &&
    values[0][0].toLowerCase().includes("name")
      ? 1
      : 0;

  // Find row index
  const matchIndex = values.findIndex((r, i) => {
    if (i < headerOffset) return false;
    return (r[0] || "") === product.name && Number(r[1] || 0) === Number(product.price);
  });

  if (matchIndex === -1) throw new Error("Product not found");

  // Get numeric sheetId for "Products"
  const meta = await gapi.client.sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const sheet = meta.result.sheets.find((s) => s.properties.title === "Products");
  const sheetId = sheet.properties.sheetId;

  // Delete the row
  await gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    resource: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: matchIndex,
              endIndex: matchIndex + 1,
            },
          },
        },
      ],
    },
  });
}
