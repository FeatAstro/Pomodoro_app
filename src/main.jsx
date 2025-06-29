import React from "react";
import ReactDOM from "react-dom/client";
import PomodoroApp from "./App.jsx"; // Your main component
import "./App.css"; // This will now include Tailwind

// Hide loading spinner once React is ready
const hideLoading = () => {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = 'none';
  }
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PomodoroApp />
  </React.StrictMode>,
);

// Hide loading spinner after render
hideLoading();