import { createBrowserRouter, Navigate } from "react-router";
import Login from "./pages/Login";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Analytics from "./pages/Analytics";
import Audit from "./pages/Audit";
import WorkerKPI from "./pages/WorkerKPI";
import Debts from "./pages/Debts";
import DebtDetail from "./pages/DebtDetail";
import Workers from "./pages/Workers";
import Layout from "./components/Layout";
import { DirectorOnly, DirectorOrWorker, RoleHomeRedirect } from "./components/RoleGate";
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
      { index: true, Component: RoleHomeRedirect },
      {
        path: "analytics",
        element: (
          <DirectorOnly>
            <Analytics />
          </DirectorOnly>
        ),
      },
      {
        path: "audit",
        element: (
          <DirectorOnly>
            <Audit />
          </DirectorOnly>
        ),
      },
      {
        path: "worker-kpi",
        element: (
          <DirectorOnly>
            <WorkerKPI />
          </DirectorOnly>
        ),
      },
      {
        path: "debts",
        element: (
          <DirectorOrWorker>
            <Debts />
          </DirectorOrWorker>
        ),
      },
      {
        path: "debts/:id",
        element: (
          <DirectorOrWorker>
            <DebtDetail />
          </DirectorOrWorker>
        ),
      },
      {
        path: "workers",
        element: (
          <DirectorOnly>
            <Workers />
          </DirectorOnly>
        ),
      },
      {
        path: "products",
        element: (
          <DirectorOrWorker>
            <Products />
          </DirectorOrWorker>
        ),
      },
      {
        path: "products/:id",
        element: (
          <DirectorOrWorker>
            <ProductDetail />
          </DirectorOrWorker>
        ),
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
