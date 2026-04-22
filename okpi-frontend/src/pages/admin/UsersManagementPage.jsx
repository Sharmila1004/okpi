import ErrorAlert from "../../components/common/ErrorAlert";
import Table from "../../components/common/Table";

const demoUsers = [
  { id: 1, fullName: "Admin User", email: "admin@okpi.local", role: "ADMIN" }
];

export default function UsersManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-ink">Users</h1>
        <p className="text-slate-500">
          Admin user management is scaffolded here, but the current backend does not
          expose user-list endpoints yet.
        </p>
      </div>

      <ErrorAlert message="User management is currently running on placeholder data until the auth service exposes admin APIs." />
      <Table
        columns={[
          { key: "fullName", label: "Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" }
        ]}
        rows={demoUsers}
      />
    </div>
  );
}
