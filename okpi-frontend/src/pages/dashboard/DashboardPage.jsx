import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useInRouterContext } from "react-router-dom";
import { ArrowUpRight, BarChart3, ChevronDown, Target, TriangleAlert } from "lucide-react";
import { getUsersSummary, getUsers, assignManagerTeam } from "../../api/authApi";
import { getKpis } from "../../api/kpiApi";
import { getObjectiveDashboard } from "../../api/objectiveApi";
import ProgressBar from "../../components/charts/ProgressBar";
import StatsCard from "../../components/charts/StatsCard";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/common/Modal";
import { useAuth } from "../../hooks/useAuth";
import { useFetch } from "../../hooks/useFetch";
import { formatDate } from "../../utils/formatters";
import { humanizeEnum, isManagerOrAdmin, normalizeRole } from "../../utils/display";
import { ROLES } from "../../utils/constants";

function getDisplayName(user, fallback = "User") {
  if (!user) return fallback;
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email || fallback;
}

function summarizeNames(names, limit = 3, emptyLabel = "None") {
  const filtered = names.filter(Boolean);
  if (!filtered.length) return emptyLabel;
  if (filtered.length <= limit) return filtered.join(", ");
  return `${filtered.slice(0, limit).join(", ")} +${filtered.length - limit} more`;
}

function buildUserDirectory(users = []) {
  return new Map(
      users.filter((u) => u?.id != null).map((u) => [String(u.id), u])
  );
}

function resolveUserName(dir, id, fallback = "User") {
  if (id == null) return fallback;
  const u = dir.get(String(id));
  return getDisplayName(u, fallback);
}

function groupObjectivesByOwner(objectives, userDir) {
  const groups = new Map();
  objectives.forEach((obj) => {
    if (obj.ownerId == null) return;
    const owner = userDir.get(String(obj.ownerId));
    const ownerRole = normalizeRole(owner?.role);
    const key = String(obj.ownerId);
    if (!groups.has(key)) {
      groups.set(key, {
        ownerId: obj.ownerId,
        ownerName: getDisplayName(owner, ownerRole === ROLES.ADMIN ? "Admin" : "Manager"),
        ownerRole,
        objectives: [],
        memberIds: new Set(),
        memberNames: new Set(),
      });
    }
    const g = groups.get(key);
    g.objectives.push(obj);
    (obj.assigneeIds ?? []).forEach((aid) => {
      if (aid == null) return;
      g.memberIds.add(aid);
      g.memberNames.add(resolveUserName(userDir, aid, "Member"));
    });
  });
  const rolePri = (r) => (r === ROLES.MANAGER ? 0 : r === ROLES.ADMIN ? 1 : 2);
  return [...groups.values()]
      .map((g) => ({
        ...g,
        memberIds: [...g.memberIds],
        memberNames: [...g.memberNames].sort((a, b) => a.localeCompare(b)),
      }))
      .sort((a, b) => {
        const d = rolePri(a.ownerRole) - rolePri(b.ownerRole);
        return d !== 0 ? d : a.ownerName.localeCompare(b.ownerName);
      });
}

function describeLatestUpdate(obj, userDir) {
  const at = obj.lastUpdatedAt;
  const by = obj.lastUpdatedByUserId != null
      ? resolveUserName(userDir, obj.lastUpdatedByUserId, "User")
      : null;
  if (!at && !by) return "No updates yet";
  if (at && by) return `${formatDate(at)} by ${by}`;
  if (at) return `${formatDate(at)} update recorded`;
  return `Updated by ${by}`;
}

export default function DashboardPage() {
  const [expandedManagerId, setExpandedManagerId] = useState(null);
  const { user, accessToken } = useAuth();
  const [pickTeamOpen, setPickTeamOpen] = useState(false);
  const [managerTeamMembers, setManagerTeamMembers] = useState([]);
  const [managerTeamLoading, setManagerTeamLoading] = useState(false);
  const [managerTeamError, setManagerTeamError] = useState("");
  const [managerTeamSaving, setManagerTeamSaving] = useState(false);
  const hasRouter = useInRouterContext();
  const normalizedRole = normalizeRole(user?.role);
  const isAdmin = normalizedRole === ROLES.ADMIN;
  const isManager = normalizedRole === ROLES.MANAGER;
  const showTeamWatchlist = isManagerOrAdmin(normalizedRole);
  const canCreateObjectives = showTeamWatchlist;
  const dashboardOwnerId = isManager ? user?.id ?? undefined : undefined;
  const authKey = accessToken ?? "";

  const objectiveDashboardState = useFetch(
      () => getObjectiveDashboard(dashboardOwnerId),
      [authKey, dashboardOwnerId]
  );
  const setObjectiveDashboardData = objectiveDashboardState.setData;
  const insightsState = useFetch(getKpis, [authKey]);

  useEffect(() => {
    async function onObjectiveUpdated() {
      try {
        const dash = await getObjectiveDashboard(dashboardOwnerId);
        setObjectiveDashboardData(dash);
      } catch { /* ignore */ }
    }
    window.addEventListener("okpi:objective-updated", onObjectiveUpdated);
    return () => window.removeEventListener("okpi:objective-updated", onObjectiveUpdated);
  }, [authKey, dashboardOwnerId, setObjectiveDashboardData]);

  const dashboard = objectiveDashboardState.data ?? {
    objectiveCount: 0, keyResultCount: 0, objectives: [],
  };
  const objectives = dashboard.objectives ?? [];
  const insights = insightsState.data ?? [];

  const summaryIds = useMemo(() => {
    if (!showTeamWatchlist) return [];
    const ids = new Set();
    objectives.forEach((obj) => {
      if (obj.ownerId != null) ids.add(obj.ownerId);
      (obj.assigneeIds ?? []).forEach((aid) => { if (aid != null) ids.add(aid); });
      if (obj.lastUpdatedByUserId != null) ids.add(obj.lastUpdatedByUserId);
    });
    if (isManager && user?.id != null) ids.add(user.id);
    return [...ids].sort((a, b) => a - b);
  }, [isManager, objectives, showTeamWatchlist, user?.id]);

  const teamUsersState = useFetch(
      () => {
        if (!showTeamWatchlist || !summaryIds.length) return Promise.resolve([]);
        return getUsersSummary(summaryIds);
      },
      [authKey, showTeamWatchlist, summaryIds.join(",")]
  );

  const userDirectory = useMemo(
      () => buildUserDirectory(teamUsersState.data ?? []),
      [teamUsersState.data]
  );

  const groupedObjectives = useMemo(() => {
    let groups = showTeamWatchlist
        ? groupObjectivesByOwner(objectives, userDirectory)
        : [];
    if (isAdmin) groups = groups.filter((g) => g.ownerRole === ROLES.MANAGER);
    return groups;
  }, [objectives, showTeamWatchlist, userDirectory, isAdmin]);

  useEffect(() => {
    if (expandedManagerId == null) return;
    const still = groupedObjectives.some(
        (g) => String(g.ownerId) === expandedManagerId
    );
    if (!still) setExpandedManagerId(null);
  }, [expandedManagerId, groupedObjectives]);

  async function openPickTeamModal() {
    setManagerTeamError("");
    setManagerTeamLoading(true);
    setPickTeamOpen(true);
    try {
      const resp = await getUsers({ page: 0, size: 1000, role: "MEMBER" });
      const members = (resp.content ?? []).map((m) => ({
        ...m,
        selected:
            String(m.managerId ?? m.manager?.id ?? "") === String(user?.id),
      })).filter((m) =>
          !m.managerId || String(m.managerId) === String(user?.id)
      );
      setManagerTeamMembers(members);
    } catch {
      setManagerTeamError("Failed to load members.");
    } finally {
      setManagerTeamLoading(false);
    }
  }

  function toggleManagerMember(id) {
    setManagerTeamMembers((cur) =>
        cur.map((m) =>
            String(m.id) === String(id) ? { ...m, selected: !m.selected } : m
        )
    );
  }

  async function saveManagerTeam() {
    setManagerTeamSaving(true);
    setManagerTeamError("");
    const selected = managerTeamMembers
        .filter((m) => m.selected)
        .map((m) => m.id);
    try {
      await assignManagerTeam(user.id, selected);
      window.dispatchEvent(new Event("okpi:teams-updated"));
      setPickTeamOpen(false);
    } catch {
      setManagerTeamError("Failed to save team selections.");
    } finally {
      setManagerTeamSaving(false);
    }
  }

  const loadErrors = [
    objectiveDashboardState.error,
    insightsState.error,
    ...(showTeamWatchlist ? [teamUsersState.error] : []),
  ].filter(Boolean);

  if (
      objectiveDashboardState.loading ||
      insightsState.loading ||
      (showTeamWatchlist && teamUsersState.loading)
  ) {
    return <LoadingSpinner label="Loading dashboard..." />;
  }

  const completedObjectives = objectives.filter(
      (o) => o.status === "COMPLETED"
  ).length;
  const onTrackObjectives = objectives.filter(
      (o) => o.status === "ON_TRACK" || o.status === "COMPLETED"
  ).length;
  const attentionObjectives = objectives.filter(
      (o) => o.status === "AT_RISK" || o.status === "OFF_TRACK"
  ).length;
  const averageProgress = objectives.length
      ? Math.round(
          objectives.reduce((t, o) => t + Number(o.progress ?? 0), 0) /
          objectives.length
      )
      : 0;
  const onTrackRate = objectives.length
      ? Math.round((onTrackObjectives / objectives.length) * 100)
      : 0;
  const objectiveCount = dashboard.objectiveCount || objectives.length;
  const keyResultCount = dashboard.keyResultCount || 0;

  const ActionLink = hasRouter ? RouterLink : "a";

  return (
      <div className="space-y-8">
        {[...new Set(loadErrors)].map((msg, i) => (
            <ErrorAlert key={i} message={msg} />
        ))}

        <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              OKPI Hub
            </p>
            <h1 className="text-3xl font-black tracking-tight text-ink">Overview</h1>
          </div>
          {canCreateObjectives && (
              <ActionLink to="/objectives/new">
                <Button variant="accent">
                  <Target className="h-4 w-4" />
                  New goal
                </Button>
              </ActionLink>
          )}
        </section>

        {/* ── Stats — all 4 clickable ── */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ActionLink
              to="/objectives"
              className="group block h-full cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
          >
            <StatsCard
                icon={Target}
                label="Total goals"
                value={objectiveCount}
                helper={`${completedObjectives} completed`}
                badge={`${Math.max(objectiveCount - completedObjectives, 0)} open`}
                badgeTone="slate"
                accentTone="slate"
            />
          </ActionLink>

          <ActionLink
              to="/objectives"
              className="group block h-full cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
          >
            <StatsCard
                icon={BarChart3}
                label="Key results tracked"
                value={keyResultCount}
                helper={`${averageProgress}% average progress`}
                accentTone="blue"
            />
          </ActionLink>

          <ActionLink
              to="/objectives?filter=on_track"
              className="group block h-full cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
          >
            <StatsCard
                icon={ArrowUpRight}
                label="On track"
                value={onTrackObjectives}
                helper={`${onTrackRate}% on track`}
                badge={`${onTrackRate}%`}
                badgeTone="emerald"
                accentTone="emerald"
            />
          </ActionLink>

          <ActionLink
              to="/objectives?filter=attention"
              className="group block h-full cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
          >
            <StatsCard
                icon={TriangleAlert}
                label="Needs attention"
                value={attentionObjectives}
                helper={`${attentionObjectives} at risk or behind`}
                badge={`${attentionObjectives}`}
                badgeTone="amber"
                accentTone="amber"
            />
          </ActionLink>
        </section>

        {/* ── Team watchlist ── */}
        <section className="card-surface p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black tracking-tight text-ink">
                {isAdmin ? "Managers and teams" : showTeamWatchlist ? "Team watchlist" : "Insight watchlist"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {isAdmin
                    ? "Click a manager to open their objectives and team."
                    : showTeamWatchlist
                        ? "Click a manager to open their objectives, key results, and latest updates."
                        : "Keep the most important indicators visible."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isManager && (
                  <Button variant="secondary" size="sm" onClick={openPickTeamModal}>
                    Select team
                  </Button>
              )}
              <ActionLink to={showTeamWatchlist ? "/objectives" : "/insights"}>
                <Button variant="secondary" size="sm">
                  {showTeamWatchlist ? "View objectives" : "View all"}
                </Button>
              </ActionLink>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {showTeamWatchlist ? (
                groupedObjectives.length ? (
                    <div className="space-y-3">
                      {groupedObjectives.map((group) => {
                        const groupId = String(group.ownerId);
                        const isExpanded = expandedManagerId === groupId;
                        const panelId = `manager-panel-${groupId}`;
                        const headerId = `manager-header-${groupId}`;
                        const objLabel =
                            group.objectives.length === 1 ? "objective" : "objectives";
                        const teamSummary = summarizeNames(
                            group.memberNames, 3, "No assigned members yet"
                        );
                        return (
                            <article
                                key={group.ownerId}
                                className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50/80"
                            >
                              <button
                                  id={headerId}
                                  type="button"
                                  className={`flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f67ff]/30 ${isExpanded ? "bg-white" : ""}`}
                                  aria-expanded={isExpanded}
                                  aria-controls={panelId}
                                  onClick={() =>
                                      setExpandedManagerId((cur) =>
                                          cur === groupId ? null : groupId
                                      )
                                  }
                              >
                                <div className="min-w-0 space-y-2">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                      {humanizeEnum(group.ownerRole || ROLES.MANAGER)}
                                    </p>
                                    <h4 className="text-xl font-black tracking-tight text-ink">
                                      {group.ownerName}
                                    </h4>
                                  </div>
                                  <p className="text-sm text-slate-500">
                                    Members: {teamSummary}
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-3">
                                  <div className="text-right text-sm text-slate-500">
                                    <div className="font-semibold text-ink">
                                      {group.objectives.length} {objLabel}
                                    </div>
                                    <div>{group.memberNames.length} team members</div>
                                  </div>
                                  <ChevronDown
                                      className={`h-5 w-5 text-slate-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                  />
                                </div>
                              </button>

                              {isExpanded && (
                                  <div
                                      id={panelId}
                                      role="region"
                                      aria-labelledby={headerId}
                                      className="border-t border-slate-200 bg-white px-5 py-5"
                                  >
                                    <div className="space-y-3">
                                      {group.objectives.map((obj) => {
                                        const progress = Number(
                                            obj.progress ?? obj.progressPercentage ?? 0
                                        );
                                        const assigneeNames = (obj.assigneeIds ?? []).map(
                                            (aid) => resolveUserName(userDirectory, aid, "Member")
                                        );
                                        const krLabel =
                                            (obj.keyResultCount ?? obj.keyResults?.length ?? 0) === 1
                                                ? "key result"
                                                : "key results";
                                        return (
                                            <div
                                                key={obj.id}
                                                className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-4"
                                            >
                                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="min-w-0 space-y-3">
                                                  <div className="flex flex-wrap items-center gap-3">
                                                    <h5 className="text-lg font-bold text-ink">
                                                      {obj.title}
                                                    </h5>
                                                    <StatusBadge status={obj.status} />
                                                  </div>
                                                  <p className="text-sm leading-6 text-slate-600">
                                                    {obj.description || "No description."}
                                                  </p>
                                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                                        <span>
                                          {obj.keyResultCount ??
                                              obj.keyResults?.length ??
                                              0}{" "}
                                          {krLabel}
                                        </span>
                                                    <span>
                                          Assigned:{" "}
                                                      {summarizeNames(
                                                          assigneeNames, 3, "No assigned members"
                                                      )}
                                        </span>
                                                    <span>
                                          Last update:{" "}
                                                      {describeLatestUpdate(obj, userDirectory)}
                                        </span>
                                                  </div>
                                                </div>
                                                <ActionLink
                                                    to={`/objectives/${obj.id}`}
                                                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[16px] bg-white px-3 text-sm font-semibold text-ink ring-1 ring-slate-200 transition hover:bg-slate-50"
                                                >
                                                  <ArrowUpRight className="h-4 w-4" />
                                                  Open
                                                </ActionLink>
                                              </div>
                                              <div className="mt-4">
                                                <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                  <span>Progress</span>
                                                  <span className="text-sm font-black tracking-normal text-ink">
                                        {progress}%
                                      </span>
                                                </div>
                                                <ProgressBar value={progress} />
                                              </div>
                                            </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                              )}
                            </article>
                        );
                      })}
                    </div>
                ) : (
                    <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
                      No team objectives found.
                    </div>
                )
            ) : (
                <>
                  {insights.slice(0, 4).map((insight) => (
                      <ActionLink
                          key={insight.id}
                          to={`/insights/${insight.id}`}
                          className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4 transition hover:border-[#2f67ff]/30 hover:bg-white"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-ink">{insight.name}</div>
                          <div className="text-sm text-slate-500">
                            {humanizeEnum(insight.frequency)}
                            {insight.unit ? ` - ${insight.unit}` : ""}
                          </div>
                        </div>
                      </ActionLink>
                  ))}
                  {!insights.length && (
                      <p className="text-sm text-slate-500">
                        No insight data available yet.
                      </p>
                  )}
                </>
            )}
          </div>
        </section>

        {/* ── Pick team modal (manager) ── */}
        <Modal
            title="Pick your team"
            open={pickTeamOpen}
            onClose={() => setPickTeamOpen(false)}
        >
          <div className="space-y-4">
            <ErrorAlert message={managerTeamError} />
            {managerTeamLoading ? (
                <LoadingSpinner label="Loading members..." />
            ) : (
                <div className="grid gap-2 max-h-72 overflow-auto">
                  {managerTeamMembers.map((m) => (
                      <label
                          key={m.id}
                          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <input
                            type="checkbox"
                            checked={!!m.selected}
                            onChange={() => toggleManagerMember(m.id)}
                            className="h-4 w-4 rounded border-slate-300"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-ink">
                            {[m.firstName, m.lastName].filter(Boolean).join(" ") ||
                                m.email}
                          </div>
                          <div className="text-xs text-slate-500">{m.email}</div>
                        </div>
                      </label>
                  ))}
                </div>
            )}
            <div className="flex items-center justify-end gap-3">
              <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setPickTeamOpen(false)}
                  disabled={managerTeamSaving}
              >
                Cancel
              </Button>
              <Button
                  type="button"
                  onClick={saveManagerTeam}
                  disabled={managerTeamSaving}
              >
                {managerTeamSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
  );
}
