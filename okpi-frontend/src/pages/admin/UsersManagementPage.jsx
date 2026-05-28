import { useState } from "react";
import { PencilLine, Save, Trash2, Users } from "lucide-react";
import { changeUserRole, deleteUser, getUsers, updateUserByAdmin, assignManagerTeam } from "../../api/authApi";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Input from "../../components/common/Input";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import Table from "../../components/common/Table";
import { useAuth } from "../../hooks/useAuth";
import { useFetch } from "../../hooks/useFetch";
import { getApiErrorMessage } from "../../utils/apiError";
import { formatDate } from "../../utils/formatters";
import { formatUserStatus, getRoleLabel, normalizeRole } from "../../utils/display";
import { ROLES } from "../../utils/constants";
import { isValidEmail } from "../../utils/validators";

const PAGE_SIZE = 10;

const EMPTY_EDIT_FORM = {
  firstName: "",
  lastName: "",
  email: ""
};

function buildUserForm(user) {
  return {
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? ""
  };
}

function buildCurrentUser(user) {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();

  return {
    id: user?.id ?? null,
    email: user?.email ?? "",
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    name: name || user?.email || "Authenticated User",
    role: normalizeRole(user?.role) ?? ROLES.MEMBER,
    active: user?.active ?? true
  };
}

export default function UsersManagementPage() {
  const { user: currentUser, setUser, logout } = useAuth();
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("all");
  const [reloadKey, setReloadKey] = useState(0);
  const [actionError, setActionError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [managingTeamFor, setManagingTeamFor] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState("");
  const [teamSaving, setTeamSaving] = useState(false);

  const usersState = useFetch(
    () =>
      getUsers({
        page: page - 1,
        size: PAGE_SIZE,
        role: roleFilter === "all" ? undefined : roleFilter
      }),
    [page, roleFilter, reloadKey]
  );

  const usersPage = usersState.data ?? {
    content: [],
    totalPages: 1,
    totalElements: 0
  };

  function openEditModal(user) {
    setEditingUser(user);
    setEditForm(buildUserForm(user));
    setEditError("");
    setSavingEdit(false);
  }

  function closeEditModal() {
    setEditingUser(null);
    setEditForm(EMPTY_EDIT_FORM);
    setEditError("");
    setSavingEdit(false);
  }

  function handleEditChange(event) {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    setEditError("");

    if (!editingUser) {
      return;
    }

    const firstName = editForm.firstName.trim();
    const lastName = editForm.lastName.trim();
    const email = editForm.email.trim();

    if (!firstName || !lastName) {
      setEditError("First and last name are required.");
      return;
    }

    if (!isValidEmail(email)) {
      setEditError("Enter a valid email address.");
      return;
    }

    setSavingEdit(true);
    try {
      const updated = await updateUserByAdmin(editingUser.id, {
        firstName,
        lastName,
        email
      });

      if (currentUser?.id != null && String(currentUser.id) === String(updated.id)) {
        setUser(buildCurrentUser(updated));
      }

      setReloadKey((current) => current + 1);
      closeEditModal();
    } catch (error) {
      setEditError(getApiErrorMessage(error, "Failed to update user."));
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleRoleChange(userId, role) {
    setActionError("");

    try {
      await changeUserRole(userId, role);
      setReloadKey((current) => current + 1);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Failed to update role."));
    }
  }

  function openManageTeamModal(manager) {
    setManagingTeamFor(manager);
    setTeamError("");
    setTeamMembers([]);
    setTeamLoading(true);

    // load members list
    getUsers({ page: 0, size: 1000, role: "MEMBER" })
      .then((resp) => {
        // mark checked if managerId matches
        const members = (resp.content ?? []).map((m) => ({
          ...m,
          selected: String(m.managerId ?? m.manager?.id ?? "") === String(manager.id)
        }));
        setTeamMembers(members);
      })
      .catch((err) => setTeamError(getApiErrorMessage(err, "Failed to load members.")))
      .finally(() => setTeamLoading(false));
  }

  function closeManageTeamModal() {
    setManagingTeamFor(null);
    setTeamMembers([]);
    setTeamError("");
    setTeamLoading(false);
    setTeamSaving(false);
  }

  function toggleMemberSelection(memberId) {
    setTeamMembers((current) =>
      current.map((m) => (String(m.id) === String(memberId) ? { ...m, selected: !m.selected } : m))
    );
  }

  async function saveTeamAssignments() {
    if (!managingTeamFor) return;
    setTeamSaving(true);
    setTeamError("");
    const selectedIds = teamMembers.filter((m) => m.selected).map((m) => m.id);

    try {
      // Prefer bulk assign API if available
      await assignManagerTeam(managingTeamFor.id, selectedIds);
      setReloadKey((c) => c + 1);
      closeManageTeamModal();
    } catch (err) {
      // Fallback: try updating users individually
      try {
        await Promise.all(
          teamMembers.map((m) =>
            updateUserByAdmin(m.id, { managerId: m.selected ? managingTeamFor.id : null })
          )
        );
        setReloadKey((c) => c + 1);
        closeManageTeamModal();
      } catch (err2) {
        setTeamError(getApiErrorMessage(err2, "Failed to save team assignments."));
      }
    } finally {
      setTeamSaving(false);
    }
  }

  async function handleDeleteUser(user) {
    setActionError("");

    if (!window.confirm("Delete this user?")) {
      return;
    }

    try {
      await deleteUser(user.id);

      if (currentUser?.id != null && String(currentUser.id) === String(user.id)) {
        await logout();
        return;
      }

      setReloadKey((current) => current + 1);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Failed to delete user."));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-ink">People</h1>
        <p className="text-slate-500">
          Manage access and teams.
        </p>
      </div>

      <div className="card-surface flex flex-col gap-4 p-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink">Role</span>
            <select
              value={roleFilter}
              onChange={(event) => {
                setPage(1);
                setRoleFilter(event.target.value);
              }}
              className="control-surface md:w-56"
            >
              <option value="all">All</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="MEMBER">Member</option>
            </select>
          </label>
        </div>
        <div className="text-sm text-slate-500">
          {usersPage.totalElements} users in view
        </div>
      </div>

      <ErrorAlert message={actionError || usersState.error} />
      {usersState.loading ? <LoadingSpinner label="Loading users..." /> : null}
      {!usersState.loading ? (
        <Table
          columns={[
            {
              key: "name",
              label: "Name",
              render: (row) => (
                <div className="space-y-1">
                  <div className="font-semibold text-ink">
                    {[row.firstName, row.lastName].filter(Boolean).join(" ") || row.email}
                  </div>
                  <div className="text-sm text-slate-500">{formatDate(row.createdAt)}</div>
                </div>
              )
            },
            { key: "email", label: "Email" },
            {
              key: "role",
              label: "Role",
              render: (row) => (
                <select
                  value={row.role}
                  onChange={(event) => handleRoleChange(row.id, event.target.value)}
                  className="control-surface min-w-[140px]"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="MEMBER">Member</option>
                </select>
              )
            },
            {
              key: "active",
              label: "Status",
              render: (row) => formatUserStatus(row.active)
            },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="whitespace-nowrap"
                    onClick={() => openEditModal(row)}
                  >
                    <PencilLine className="h-4 w-4" />
                    Edit
                  </Button>
                  {row.role === "MANAGER" ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="whitespace-nowrap"
                      onClick={() => openManageTeamModal(row)}
                    >
                      <Users className="h-4 w-4" />
                      Manage team
                    </Button>
                  ) : null}
                  <Button
                    variant="danger"
                    size="sm"
                    className="whitespace-nowrap"
                    onClick={() => handleDeleteUser(row)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              )
            }
          ]}          rows={usersPage.content}
          emptyMessage="No users found for the selected filter."
        />
      ) : null}

      <Pagination
        page={page}
        totalPages={usersPage.totalPages || 1}
        onPageChange={setPage}
      />
      <Modal title="Edit profile" open={Boolean(editingUser)} onClose={closeEditModal}>
        <form className="space-y-4" onSubmit={handleEditSubmit}>
          <ErrorAlert message={editError} />

          {editingUser ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="text-sm font-semibold text-ink">
                {[editingUser.firstName, editingUser.lastName].filter(Boolean).join(" ") ||
                  editingUser.email}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {editingUser.email} - {getRoleLabel(editingUser.role)}
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name *"
              name="firstName"
              value={editForm.firstName}
              onChange={handleEditChange}
              required
            />
            <Input
              label="Last name *"
              name="lastName"
              value={editForm.lastName}
              onChange={handleEditChange}
              required
            />
          </div>

          <Input
            label="Email *"
            name="email"
            type="email"
            value={editForm.email}
            onChange={handleEditChange}
            required
          />

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              className="whitespace-nowrap"
              onClick={closeEditModal}
              disabled={savingEdit}
            >
              Cancel
            </Button>
            <Button type="submit" className="whitespace-nowrap" disabled={savingEdit}>
              <Save className="h-4 w-4" />
              {savingEdit ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal title={
        managingTeamFor ? `Team for ${[managingTeamFor.firstName, managingTeamFor.lastName].filter(Boolean).join(" ")}` : "Team"
      } open={Boolean(managingTeamFor)} onClose={closeManageTeamModal}>
        <div className="space-y-4">
          <ErrorAlert message={teamError} />
          {teamLoading ? (
            <LoadingSpinner label="Loading members..." />
          ) : (
            <div className="grid gap-2 max-h-72 overflow-auto">
              {teamMembers.map((m) => (
                <label key={m.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <input type="checkbox" checked={!!m.selected} onChange={() => toggleMemberSelection(m.id)} className="h-4 w-4 rounded border-slate-300" />
                  <div className="min-w-0">
                    <div className="font-semibold text-ink">{[m.firstName, m.lastName].filter(Boolean).join(" ") || m.email}</div>
                    <div className="text-xs text-slate-500">{m.email}</div>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" type="button" onClick={closeManageTeamModal} disabled={teamSaving}>Cancel</Button>
            <Button type="button" onClick={saveTeamAssignments} disabled={teamSaving}>
            {teamSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
