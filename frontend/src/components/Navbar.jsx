import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/slices/authSlice";
import { disconnectSocket } from "../lib/socket";
import { LogOut, MessageSquare, Sun, Moon, User } from "lucide-react";
import toast from "react-hot-toast";
import { toggleTheme } from "../store/slices/themeSlice";

const Navbar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { theme } = useAppSelector((state) => state.theme);

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      disconnectSocket();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  return (
    <header className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-lg bg-base-100/80">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Chatty</h1>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleThemeToggle}
              className="btn btn-circle btn-sm transition-colors"
              title={theme === "whatsapp-light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "whatsapp-light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>

            {user && (
              <>
                <Link
                  to="/profile"
                  className="btn btn-circle btn-sm transition-colors"
                  title="Profile"
                >
                  <User className="w-4 h-4" />
                </Link>

                <button
                  className="btn btn-circle btn-sm transition-colors"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
