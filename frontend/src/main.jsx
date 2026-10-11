import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// Design tokens first: every other stylesheet references the variables it
// defines, so this import must come before them.
// Self-hosted so the page contacts no third party for fonts: Google Fonts
// would see every visitor's IP address. The variable font also covers the
// 650 weight, which Inter's static cut does not.
import "@fontsource-variable/inter";
import "./index.css";
import "leaflet/dist/leaflet.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
