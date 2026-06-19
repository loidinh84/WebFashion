import React, { StrictMode } from "react";
import ReactDom from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { StoreProvider } from "./context/StoreContext.jsx";
import { ToastContainer } from "react-toastify";
import { createRoot } from "react-dom/client";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <StoreProvider>
        <Router>
          <ToastContainer position="top-right" autoClose={2000} />
          <App />
        </Router>
      </StoreProvider>
    </AuthProvider>
  </StrictMode>,
);
