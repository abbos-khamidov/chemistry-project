import { createBrowserRouter, Navigate } from "react-router";
import Login from "./pages/Login";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Analytics from "./pages/Analytics";
import Audit from "./pages/Audit";
import WorkerKPI from "./pages/WorkerKPI";
import Debts from "./pages/Debts";
import Clients from "./pages/Clients";
import DebtDetail from "./pages/DebtDetail";
import Workers from "./pages/Workers";
import Layout from "./components/Layout";
import { DebtsVisibleOnly, DirectorOnly, DirectorOrWorker, RoleHomeRedirect, StaffManagerOnly } from "./components/RoleGate";
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
        path: "clients",
        element: (
          <DirectorOrWorker>
            <Clients />
          </DirectorOrWorker>
        ),
      },
      {
        path: "debts",
        element: (
          <DebtsVisibleOnly>
            <Debts />
          </DebtsVisibleOnly>
        ),
      },
      {
        path: "debts/:id",
        element: (
          <DebtsVisibleOnly>
            <DebtDetail />
          </DebtsVisibleOnly>
        ),
      },
      {
        path: "workers",
        element: (
          <StaffManagerOnly>
            <Workers />
          </StaffManagerOnly>
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
