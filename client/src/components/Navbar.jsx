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
       <div className="flex items-center gap-3">
  <img
    src="/momenta-icon.png"
    alt="Vistara"
    className="w-10 h-10 rounded-xl object-cover"
  />

  <span className="text-xl font-bold tracking-wide">
  MOMENTA
  </span>
</div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-ink">{user?.name}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role?.replace("_", " ")}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition px-3 py-1.5 rounded-lg hover:bg-gray-50"
        >
   
          <LogOut size={16} />
          Log Out
        </button>
      </div>
    </nav>
  );
}