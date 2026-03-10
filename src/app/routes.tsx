import { createBrowserRouter, Navigate } from "react-router";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Debts from "./pages/Debts";
import DebtDetail from "./pages/DebtDetail";
import Analytics from "./pages/Analytics";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Layout from "./components/Layout";
import { useAuth } from "./context/AuthContext";

function ProtectedLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout />;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: ProtectedLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "products", Component: Products },
      { path: "products/:id", Component: ProductDetail },
      { path: "debts", Component: Debts },
      { path: "debts/:id", Component: DebtDetail },
      { path: "analytics", Component: Analytics },
      { path: "users", Component: Users },
      { path: "settings", Component: Settings },
    ],
  },
]);
