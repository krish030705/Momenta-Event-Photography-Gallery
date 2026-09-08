// App.jsx
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import EventDetails from "./pages/EventDetails";
import CustomerGallery from "./pages/CustomerGallery";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Fully public -- no auth, no ProtectedRoute, no Navbar */}
      <Route path="/gallery/:slug" element={<CustomerGallery />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/events/:id" element={<EventDetails />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;