// components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Camera } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <Camera size={22} className="text-accent" />
        <span className="font-semibold text-ink text-lg">Momenta</span>
      </Link>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-ink">{user?.name}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role?.replace("_", " ")}</p>
        </div>
        <div className="sm:hidden w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-semibold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition px-2 sm:px-3 py-1.5 rounded-lg hover:bg-gray-50"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </div>
    </nav>
  );
}