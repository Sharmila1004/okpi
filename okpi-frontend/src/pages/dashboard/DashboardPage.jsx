import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useInRouterContext } from "react-router-dom";
import { ArrowUpRight, BarChart3, ChevronDown, Target, TriangleAlert } from "lucide-react";
import { getUsersSummary, getUsers, assignManagerTeam, updateUserByAdmin } from "../../api/authApi";
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

function getDisplayName(user, fallbackLabel = "User") {
  if (!user) {
    return fallbackLabel;
  }
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email || fallbackLabel;
}

function summarizeNames(names, limit = 3, emptyLabel = "None") {
  const filteredNames = names.filter(Boolean);
  if (!filteredNames.length) {
    return emptyLabel;
  }
  if (filteredNames.length <= limit) {
    return filteredNames.join(", ");
  }
  return `${filteredNames.slice(0, limit).join(", ")} +${filteredNames.length - limit} more`;
}

function buildUserDirectory(users = []) {
  return new Map(
      users
          .filter((user) => user?.id != null)
          .map((user) => [String(user.id), user])
  );
}

function resolveUserName(userDirectory, userId, fallbackRole = "User") {
  if (userId == null) {
    return fallbackRole;
  }
  const user = userDirectory.get(String(userId));
  return getDisplayName(user, fallbackRole);
}

function groupObjectivesByOwner(objectives, userDirectory) {
  const groups = new Map();
  objectives.forEach((objective) => {
    if (objective.ownerId == null) {
      return;
    }
    const owner = userDirectory.get(String(objective.ownerId));
    const ownerRole = normalizeRole(owner?.role);
    const fallbackLabel = ownerRole === ROLES.ADMIN ? "Admin" : "Manager";
    const groupKey = String(objective.ownerId);
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        ownerId: objective.ownerId,
        ownerName: getDisplayName(owner, fallbackLabel),
        ownerRole,
        objectives: [],
        memberIds: new Set(),
        memberNames: new Set(),
      });
    }
    const group = groups.get(groupKey);
    group.objectives.push(objective);
    (objective.assigneeIds ?? []).forEach((assigneeId) => {
      if (assigneeId == null) {
        return;
      }
      group.memberIds.add(assigneeId);
      group.memberNames.add(resolveUserName(userDirectory, assigneeId, "Member"));
    });
  });
  const rolePriority = (role) => {
    if (role === ROLES.MANAGER) {
      return 0;
    }
    if (role === ROLES.ADMIN) {
      return 1;
    }
    return 2;
  };
  return [...groups.values()]
      .map((group) => ({
        ...group,
        memberIds: [...group.memberIds],
        memberNames: [...group.memberNames].sort((left, right) => left.localeCompare(right)),
      }))
      .sort((left, right) => {
        const roleDelta = rolePriority(left.ownerRole) - rolePriority(right.ownerRole);
        if (roleDelta !== 0) {
          return roleDelta;
        }
        return left.ownerName.localeCompare(right.ownerName);
      });
}

function describeLatestUpdate(objective, userDirectory) {
  const updatedAt = objective.lastUpdatedAt;
  const updaterName =
      objective.lastUpdatedByUserId != null
          ? resolveUserName(userDirectory, objective.lastUpdatedByUserId, "User")
          : null;
  if (!updatedAt && !updaterName) {
    return "No updates yet";
  }
  if (updatedAt && updaterName) {
    return `${formatDate(updatedAt)} by ${updaterName}`;
  }
  if (updatedAt) {
    return `${formatDate(updatedAt)} update recorded`;
  }
  return `Updated by ${updaterName}`;
}

function ObjectiveRowLink({ hasRouter, objectiveId, children }) {
  const LinkComponent = hasRouter ? RouterLink : "a";
  const linkProps = hasRouter
      ? { to: `/objectives/${objectiveId}` }
      : { href: `/objectives/${objectiveId}` };
  return (
      <LinkComponent
          {...linkProps}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[16px] bg-white px-3 text-sm font-semibold text-ink ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f67ff]/30"
      >
        {children}
      </LinkComponent>
  );
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
      } catch {
        // ignore
      }
    }
    window.addEventListener("okpi:objective-updated", onObjectiveUpdated);
    return () => window.removeEventListener("okpi:objective-updated", onObjectiveUpdated);
  }, [authKey, dashboardOwnerId, setObjectiveDashboardData]);

  const dashboard = objectiveDashboardState.data ?? {
    objectiveCount: 0,
    keyResultCount: 0,
    objectives: [],
  };
  const objectives = dashboard.objectives ?? [];
  const insights = insightsState.data ?? [];

  const summaryIds = useMemo(() => {
    if (!showTeamWatchlist) {
      return [];
    }
    const ids = new Set();
    objectives.forEach((objective) => {
      if (objective.ownerId != null) {
        ids.add(objective.ownerId);
      }
      (objective.assigneeIds ?? []).forEach((assigneeId) => {
        if (assigneeId != null) {
          ids.add(assigneeId);
        }
      });
      if (objective.lastUpdatedByUserId != null) {
        ids.add(objective.lastUpdatedByUserId);
      }
    });
    if (isManager && user?.id != null) {
      ids.add(user.id);
    }
    return [...ids].sort((left, right) => left - right);
  }, [isManager, objectives, showTeamWatchlist, user?.id]);

  const summaryKey = summaryIds.join(",");
  const teamUsersState = useFetch(
      () => {
        if (!showTeamWatchlist || !summaryIds.length) {
          return Promise.resolve([]);
        }
        return getUsersSummary(summaryIds);
      },
      [authKey, showTeamWatchlist, summaryKey]
  );

  const userDirectory = useMemo(
      () => buildUserDirectory(teamUsersState.data ?? []),
      [teamUsersState.data]
  );

  const groupedObjectives = useMemo(() => {
    let groups = showTeamWatchlist ? groupObjectivesByOwner(objectives, userDirectory) : [];
    if (isAdmin) {
      groups = groups.filter((g) => g.ownerRole === ROLES.MANAGER);
    }
    return groups;
  }, [objectives, showTeamWatchlist, userDirectory, isAdmin]);

  useEffect(() => {
    if (expandedManagerId == null) {
      return;
    }
    const stillVisible = groupedObjectives.some(
        (group) => String(group.ownerId) === expandedManagerId
    );
    if (!stillVisible) {
      setExpandedManagerId(null);
    }
  }, [expandedManagerId, groupedObjectives]);

  async function openPickTeamModal() {
    setManagerTeamError("");
    setManagerTeamLoading(true);
    setPickTeamOpen(true);
    try {
      const resp = await getUsers({ page: 0, size: 1000, role: "MEMBER" });
      const members = (resp.content ?? []).map((m) => ({
        ...m,
        selected: String(m.managerId ?? m.manager?.id ?? "") === String(user?.id),
      }));
      setManagerTeamMembers(members);
    } catch (err) {
      setManagerTeamError("Failed to load members.");
    } finally {
      setManagerTeamLoading(false);
    }
  }

  function toggleManagerMember(id) {
    setManagerTeamMembers((cur) =>
        cur.map((m) => (String(m.id) === String(id) ? { ...m, selected: !m.selected } : m))
    );
  }

  async function saveManagerTeam() {
    setManagerTeamSaving(true);
    setManagerTeamError("");
    const selected = managerTeamMembers.filter((m) => m.selected).map((m) => m.id);
    try {
      await assignManagerTeam(user.id, selected);
      setPickTeamOpen(false);
    } catch (err) {
      try {
        await Promise.all(
            managerTeamMembers.map((m) =>
                updateUserByAdmin(m.id, { managerId: m.selected ? user.id : null })
            )
        );
        setPickTeamOpen(false);
      } catch (err2) {
        setManagerTeamError("Failed to save team selections.");
      }
    } finally {
      setManagerTeamSaving(false);
    }
  }

  const loadErrors = [
    objectiveDashboardState.error,
    insightsState.error,
    ...(showTeamWatchlist ? [teamUsersState.error] : []),
  ].filter(Boolean);
  const uniqueLoadErrors = [...new Set(loadErrors)];

  if (
      objectiveDashboardState.loading ||
      insightsState.loading ||
      (showTeamWatchlist && teamUsersState.loading)
  ) {
    return <LoadingSpinner label="Loading dashboard..." />;
  }

  const completedObjectives = objectives.filter((o) => o.status === "COMPLETED").length;
  const onTrackObjectives = objectives.filter(
      (o) => o.status === "ON_TRACK" || o.status === "COMPLETED"
  ).length;
  const attentionObjectives = objectives.filter(
      (o) => o.status === "AT_RISK" || o.status === "OFF_TRACK"
  ).length;
  const averageObjectiveProgress = objectives.length
      ? Math.round(
          objectives.reduce((total, o) => total + Number(o.progress ?? 0), 0) / objectives.length
      )
      : 0;
  const onTrackRate = objectives.length
      ? Math.round((onTrackObjectives / objectives.length) * 100)
      : 0;
  const objectiveCount = dashboard.objectiveCount || objectives.length;
  const keyResultCount = dashboard.keyResultCount || 0;

  const primaryAction = canCreateObjectives
      ? { label: "New goal", to: "/objectives/new" }
      : { label: "New insight", to: "/insights/new" };
  const PrimaryActionIcon = canCreateObjectives ? Target : BarChart3;

  const watchlistTitle = showTeamWatchlist
      ? isAdmin
          ? "Managers and teams"
          : "Team watchlist"
      : "Insight watchlist";
  const watchlistDescription = showTeamWatchlist
      ? isAdmin
          ? "Managers appear first. Click a manager to open their objectives, key results, team members, and latest updates."
          : "Click a manager to open their objectives, key results, team members, and latest updates."
      : "Keep the most important indicators visible.";
  const watchlistButton = showTeamWatchlist
      ? { label: "View objectives", to: "/objectives" }
      : { label: "View all", to: "/insights" };

  const ActionLink = hasRouter ? RouterLink : "a";
  const actionLinkProps = hasRouter ? { to: primaryAction.to } : { href: primaryAction.to };
  const watchlistLinkProps = hasRouter
      ? { to: watchlistButton.to }
      : { href: watchlistButton.to };

  return (
      <div className="space-y-8">
        {uniqueLoadErrors.length ? (
            <div className="space-y-2">
              {uniqueLoadErrors.map((message, index) => (
                  <ErrorAlert key={`${index}-${message}`} message={message} />
              ))}
            </div>
        ) : null}

        <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              OKPI Hub
            </p>
            <h1 className="text-3xl font-black tracking-tight text-ink">Overview</h1>
            <p className="max-w-2xl text-sm text-slate-600">Goals & performance</p>
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <ActionLink {...actionLinkProps}>
              <Button variant="accent">
                <PrimaryActionIcon className="h-4 w-4" />
                {primaryAction.label}
              </Button>
            </ActionLink>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard
              icon={Target}
              label="Total goals"
              value={objectiveCount}
              helper={`${completedObjectives} completed`}
              badge={`${Math.max(objectiveCount - completedObjectives, 0)} open`}
              badgeTone="slate"
              accentTone="slate"
          />
          <StatsCard
              icon={BarChart3}
              label="Key results tracked"
              value={keyResultCount}
              helper={`${averageObjectiveProgress}% average progress`}
              accentTone="blue"
          />
          <RouterLink to="/objectives?filter=on_track" className="block">
            <StatsCard
                icon={ArrowUpRight}
                label="On track"
                value={onTrackObjectives}
                helper={`${onTrackRate}% on track`}
                badge={`${onTrackRate}%`}
                badgeTone="emerald"
                accentTone="emerald"
            />
          </RouterLink>
          <RouterLink to="/objectives?filter=attention" className="block">
            <StatsCard
                icon={TriangleAlert}
                label="Needs attention"
                value={attentionObjectives}
                helper={`${attentionObjectives} at risk or behind`}
                badge={`${attentionObjectives}`}
                badgeTone="amber"
                accentTone="amber"
            />
          </RouterLink>
        </section>

        <section className="card-surface p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black tracking-tight text-ink">{watchlistTitle}</h3>
              <p className="mt-1 text-sm text-slate-500">{watchlistDescription}</p>
            </div>
            <div className="flex items-center gap-2">
              {isManager ? (
                  <Button variant="secondary" size="sm" onClick={openPickTeamModal}>
                    Select team
                  </Button>
              ) : null}
              <ActionLink {...watchlistLinkProps}>
                <Button variant="secondary" size="sm">
                  {watchlistButton.label}
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
                        const objectiveLabel =
                            group.objectives.length === 1 ? "objective" : "objectives";
                        const teamMemberSummary = summarizeNames(
                            group.memberNames,
                            3,
                            "No assigned members yet"
                        );
                        return (
                            <article
                                key={group.ownerId}
                                className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50/80"
                            >
                              <button
                                  id={headerId}
                                  type="button"
                                  className={`flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f67ff]/30 ${
                                      isExpanded ? "bg-white" : ""
                                  }`}
                                  aria-expanded={isExpanded}
                                  aria-controls={panelId}
                                  onClick={() =>
                                      setExpandedManagerId((current) =>
                                          current === groupId ? null : groupId
                                      )
                                  }
                              >
                                <div className="min-w-0 space-y-2">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                      {humanizeEnum(
                                          group.ownerRole || (isAdmin ? ROLES.ADMIN : ROLES.MANAGER)
                                      )}
                                    </p>
                                    <h4 className="text-xl font-black tracking-tight text-ink">
                                      {group.ownerName}
                                    </h4>
                                  </div>
                                  <p className="text-sm text-slate-500">
                                    Members: {teamMemberSummary}
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-3">
                                  <div className="text-right text-sm text-slate-500">
                                    <div className="font-semibold text-ink">
                                      {group.objectives.length} {objectiveLabel}
                                    </div>
                                    <div>{group.memberNames.length} team members</div>
                                  </div>
                                  <ChevronDown
                                      className={`h-5 w-5 text-slate-500 transition-transform ${
                                          isExpanded ? "rotate-180" : ""
                                      }`}
                                  />
                                </div>
                              </button>

                              {isExpanded ? (
                                  <div
                                      id={panelId}
                                      role="region"
                                      aria-labelledby={headerId}
                                      className="border-t border-slate-200 bg-white px-5 py-5"
                                  >
                                    <div className="space-y-3">
                                      {group.objectives.map((objective) => {
                                        const progress = Number(
                                            objective.progress ?? objective.progressPercentage ?? 0
                                        );
                                        const assigneeNames = (objective.assigneeIds ?? []).map(
                                            (assigneeId) =>
                                                resolveUserName(userDirectory, assigneeId, "Member")
                                        );
                                        const keyResultLabel =
                                            (objective.keyResultCount ??
                                                objective.keyResults?.length ??
                                                0) === 1
                                                ? "key result"
                                                : "key results";
                                        return (
                                            <div
                                                key={objective.id}
                                                className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-4"
                                            >
                                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="min-w-0 space-y-3">
                                                  <div className="flex flex-wrap items-center gap-3">
                                                    <h5 className="text-lg font-bold text-ink">
                                                      {objective.title}
                                                    </h5>
                                                    <StatusBadge status={objective.status} />
                                                  </div>
                                                  <p className="text-sm leading-6 text-slate-600">
                                                    {objective.description || "No description."}
                                                  </p>
                                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                                        <span>
                                          {objective.keyResultCount ??
                                              objective.keyResults?.length ??
                                              0}{" "}
                                          {keyResultLabel}
                                        </span>
                                                    <span>
                                          Assigned:{" "}
                                                      {summarizeNames(assigneeNames, 3, "No assigned members")}
                                        </span>
                                                    <span>
                                          Last update:{" "}
                                                      {describeLatestUpdate(objective, userDirectory)}
                                        </span>
                                                  </div>
                                                </div>
                                                <ObjectiveRowLink
                                                    hasRouter={hasRouter}
                                                    objectiveId={objective.id}
                                                >
                                                  <ArrowUpRight className="h-4 w-4" />
                                                  Open
                                                </ObjectiveRowLink>
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
                              ) : null}
                            </article>
                        );
                      })}
                    </div>
                ) : (
                    <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
                      No team objectives match the current filter.
                    </div>
                )
            ) : (
                <>
                  {insights.slice(0, 4).map((insight) => {
                    const InsightRow = hasRouter ? RouterLink : "a";
                    const insightProps = hasRouter
                        ? { to: `/insights/${insight.id}` }
                        : { href: `/insights/${insight.id}` };
                    return (
                        <InsightRow
                            key={insight.id}
                            {...insightProps}
                            className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4 transition hover:border-[#2f67ff]/30 hover:bg-white"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-ink">{insight.name}</div>
                            <div className="text-sm text-slate-500">
                              {humanizeEnum(insight.frequency)}
                              {insight.unit ? ` - ${insight.unit}` : ""}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black text-ink">
                              {humanizeEnum(insight.frequency)}
                            </div>
                            <div className="text-sm text-slate-500">{insight.unit ?? "No unit"}</div>
                          </div>
                        </InsightRow>
                    );
                  })}
                  {!insights.length ? (
                      <p className="text-sm text-slate-500">No insight data available yet.</p>
                  ) : null}
                </>
            )}
          </div>
        </section>

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
                            {[m.firstName, m.lastName].filter(Boolean).join(" ") || m.email}
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
