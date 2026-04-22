import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { ROLES } from "../utils/constants";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import ObjectivesListPage from "../pages/objectives/ObjectivesListPage";
import ObjectiveDetailPage from "../pages/objectives/ObjectiveDetailPage";
import ObjectiveFormPage from "../pages/objectives/ObjectiveFormPage";
import KpisListPage from "../pages/kpis/KpisListPage";
import KpiDetailPage from "../pages/kpis/KpiDetailPage";
import KpiFormPage from "../pages/kpis/KpiFormPage";
import UsersManagementPage from "../pages/admin/UsersManagementPage";
import NotFoundPage from "../pages/NotFoundPage";
import ProtectedRoute from "./ProtectedRoute";

function LayoutRoute({ children }) {
  return <MainLayout>{children}</MainLayout>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/"
          element={
            <LayoutRoute>
              <DashboardPage />
            </LayoutRoute>
          }
        />
        <Route
          path="/objectives"
          element={
            <LayoutRoute>
              <ObjectivesListPage />
            </LayoutRoute>
          }
        />
        <Route
          path="/objectives/new"
          element={
            <LayoutRoute>
              <ObjectiveFormPage />
            </LayoutRoute>
          }
        />
        <Route
          path="/objectives/:objectiveId"
          element={
            <LayoutRoute>
              <ObjectiveDetailPage />
            </LayoutRoute>
          }
        />
        <Route
          path="/objectives/:objectiveId/edit"
          element={
            <LayoutRoute>
              <ObjectiveFormPage />
            </LayoutRoute>
          }
        />
        <Route
          path="/kpis"
          element={
            <LayoutRoute>
              <KpisListPage />
            </LayoutRoute>
          }
        />
        <Route
          path="/kpis/new"
          element={
            <LayoutRoute>
              <KpiFormPage />
            </LayoutRoute>
          }
        />
        <Route
          path="/kpis/:kpiId"
          element={
            <LayoutRoute>
              <KpiDetailPage />
            </LayoutRoute>
          }
        />
        <Route
          path="/kpis/:kpiId/edit"
          element={
            <LayoutRoute>
              <KpiFormPage />
            </LayoutRoute>
          }
        />
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
        <Route
          path="/admin/users"
          element={
            <LayoutRoute>
              <UsersManagementPage />
            </LayoutRoute>
          }
        />
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
