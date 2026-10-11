import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// Design tokens first: every other stylesheet references the variables it
// defines, so this import must come before them.
import "./index.css";
import "leaflet/dist/leaflet.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
