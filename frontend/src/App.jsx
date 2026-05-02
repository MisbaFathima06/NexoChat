import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { checkAuth } from "./store/slices/authSlice";
import { connectSocket, disconnectSocket, setDispatch, setStore, getSocket } from "./lib/socket";
import { store } from "./store/store";
import { getUsers } from "./store/slices/chatSlice";
import { useEffect } from "react";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import CallManager from "./components/CallManager";

const App = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const { theme } = useAppSelector((state) => state.theme) || { theme: "coffee" };

  useEffect(() => {
    setDispatch(dispatch);
    setStore(store);
  }, [dispatch]);

  useEffect(() => {
    dispatch(checkAuth()).catch((error) => {
      console.error("Auth check failed:", error);
      // Don't show error if it's just a 401 (not logged in)
      if (error?.response?.status !== 401) {
        console.error("Unexpected auth error:", error);
      }
    });
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user && user._id) {
      console.log("🔌 Connecting socket for user:", user._id);
      connectSocket(user._id);
      
      // Set up global message listener to refresh users list
      const socket = getSocket();
      if (socket) {
        const handleNewMessage = () => {
          // Refresh users list to update order and unread counts
          dispatch(getUsers(""));
        };
        
        socket.on("newMessage", handleNewMessage);
        
        return () => {
          socket.off("newMessage", handleNewMessage);
        };
      }
    } else {
      disconnectSocket();
    }
    
    return () => {
      if (!isAuthenticated) {
        disconnectSocket();
      }
    };
  }, [isAuthenticated, user, dispatch]);

  if (isLoading && !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <div data-theme={theme}>
      <Navbar />
      <CallManager />
      <Routes>
        <Route path="/" element={user ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!user ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>
      <Toaster />
    </div>
  );
};

export default App;
