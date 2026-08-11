import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLocation } from 'wouter';
import { useDeferredValue, useMemo, useState } from 'react';
import {
  filterAdminUsers,
  isAdminUserActive,
  type AdminUserRoleFilter,
  type AdminUserStatusFilter,
  type AdminUserSummary,
} from '../../../shared/adminUserFilters';
import { Settings, Users, BarChart3, Package, Zap, Lock, ArrowLeft, Plus, Trash2, ShieldCheck, ShieldOff, ScrollText, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';

type PendingModerationAction =
  | { kind: 'role'; userId: number; userLabel: string; nextRole: 'user' | 'admin' }
  | { kind: 'status'; userId: number; userLabel: string; nextStatus: 'active' | 'suspended' }
  | { kind: 'bulk-role'; userIds: number[]; nextRole: 'admin' }
  | { kind: 'bulk-status'; userIds: number[]; nextStatus: 'suspended' };

export default function OwnerControlPanel() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const requestedTab = new URLSearchParams(window.location.search).get('tab');
    return ['dashboard', 'users', 'audit', 'events', 'settings', 'features'].includes(requestedTab ?? '')
      ? requestedTab!
      : 'dashboard';
  });
  const [settings, setSettings] = useState({
    siteName: 'Anom Artsy',
    siteDescription: 'Unite physical and digital identity for social good',
    maxCoinsPerDay: 100,
    levelUpXP: 1000,
    achievementMultiplier: 1,
  });
  const [userQuery, setUserQuery] = useState('');
  const deferredUserQuery = useDeferredValue(userQuery);
  const [userRoleFilter, setUserRoleFilter] = useState<AdminUserRoleFilter>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<AdminUserStatusFilter>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  // Real-time data queries
  const { data: stats } = trpc.system.getStats.useQuery(undefined, { refetchInterval: 5000 });
  const { data: users = [], refetch: refetchUsers } = trpc.system.getAllUsers.useQuery(undefined, { refetchInterval: 10000 });
  const { data: events = [] } = trpc.system.getEvents.useQuery(undefined, { refetchInterval: 5000 });
  const { data: auditLogs = [], refetch: refetchAuditLogs } = trpc.system.getAuditLogs.useQuery(undefined, {
    enabled: activeTab === 'audit',
    refetchInterval: activeTab === 'audit' ? 5000 : false,
  });
  const filteredUsers = useMemo(
    () =>
      filterAdminUsers(users, {
        query: deferredUserQuery,
        role: userRoleFilter,
        status: userStatusFilter,
      }),
    [users, deferredUserQuery, userRoleFilter, userStatusFilter],
  );
  const visibleUserIds = useMemo(() => filteredUsers.map((target) => target.id), [filteredUsers]);
  const selectedVisibleUserIds = useMemo(
    () => selectedUserIds.filter((id) => visibleUserIds.includes(id)),
    [selectedUserIds, visibleUserIds],
  );
  const allVisibleUsersSelected = filteredUsers.length > 0 && selectedVisibleUserIds.length === filteredUsers.length;
  const selectedIncludesCurrentUser = user?.id !== undefined && selectedVisibleUserIds.includes(user.id);

  // Mutations
  const updateSettingsMutation = trpc.system.updateSettings.useMutation();
  const createEventMutation = trpc.system.createEvent.useMutation();
  const deleteEventMutation = trpc.system.deleteEvent.useMutation();
  const updateUserRoleMutation = trpc.system.updateUserRole.useMutation();
  const updateUserStatusMutation = trpc.system.updateUserStatus.useMutation();
  const bulkUpdateUserRoleMutation = trpc.system.bulkUpdateUserRole.useMutation();
  const bulkUpdateUserStatusMutation = trpc.system.bulkUpdateUserStatus.useMutation();
  const [pendingModerationAction, setPendingModerationAction] = useState<PendingModerationAction | null>(null);
  const isModerationPending = updateUserRoleMutation.isPending || updateUserStatusMutation.isPending || bulkUpdateUserRoleMutation.isPending || bulkUpdateUserStatusMutation.isPending;

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    imageUrl: '',
  });

  // Check if user is admin/owner
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b0e14] to-[#1a1f2e] p-4 flex items-center justify-center">
        <Card className="border-2 border-[#ff00cc] bg-[#0b0e14]/80 p-8 max-w-md">
          <div className="flex items-center justify-center mb-4">
            <Lock className="w-12 h-12 text-[#ff00cc]" />
          </div>
          <h1 className="text-2xl font-bold text-center text-[#ff00cc] mb-4">Access Denied</h1>
          <p className="text-center text-gray-300 mb-6">
            Only administrators can access the Owner Control Panel.
          </p>
          <Button 
            onClick={() => navigate('/')}
            className="w-full bg-[#ff00cc] hover:bg-[#ff00cc]/80 text-black font-bold"
          >
            Return to Home
          </Button>
        </Card>
      </div>
    );
  }

  const handleSaveSettings = async () => {
    try {
      await updateSettingsMutation.mutateAsync(settings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.description || !eventForm.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createEventMutation.mutateAsync({
        title: eventForm.title,
        description: eventForm.description,
        date: new Date(eventForm.date).toISOString(),
        imageUrl: eventForm.imageUrl,
      });
      toast.success('Event created successfully!');
      setEventForm({ title: '', description: '', date: '', imageUrl: '' });
    } catch (error) {
      toast.error('Failed to create event');
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await deleteEventMutation.mutateAsync({ eventId });
      toast.success('Event deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const requestRoleChange = (target: AdminUserSummary) => {
    setPendingModerationAction({
      kind: 'role',
      userId: target.id,
      userLabel: target.name || target.email || `User #${target.id}`,
      nextRole: target.role === 'admin' ? 'user' : 'admin',
    });
  };

  const requestStatusChange = (target: AdminUserSummary) => {
    setPendingModerationAction({
      kind: 'status',
      userId: target.id,
      userLabel: target.name || target.email || `User #${target.id}`,
      nextStatus: target.status === 'suspended' ? 'active' : 'suspended',
    });
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds((current) => current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId]);
  };

  const toggleAllVisibleUsers = () => {
    setSelectedUserIds((current) => {
      if (allVisibleUsersSelected) return current.filter((id) => !visibleUserIds.includes(id));
      return Array.from(new Set([...current, ...visibleUserIds]));
    });
  };

  const requestBulkRoleChange = () => {
    if (selectedVisibleUserIds.length === 0) return;
    setPendingModerationAction({ kind: 'bulk-role', userIds: selectedVisibleUserIds, nextRole: 'admin' });
  };

  const requestBulkStatusChange = () => {
    if (selectedVisibleUserIds.length === 0) return;
    setPendingModerationAction({ kind: 'bulk-status', userIds: selectedVisibleUserIds, nextStatus: 'suspended' });
  };

  const handleConfirmModeration = async () => {
    if (!pendingModerationAction) return;

    const action = pendingModerationAction;
    try {
      if (action.kind === 'role') {
        await updateUserRoleMutation.mutateAsync({ userId: action.userId, role: action.nextRole });
        toast.success(`${action.userLabel} is now ${action.nextRole === 'admin' ? 'an admin' : 'a member'}.`, { description: 'Role change recorded in the audit stream.' });
      } else if (action.kind === 'status') {
        await updateUserStatusMutation.mutateAsync({ userId: action.userId, status: action.nextStatus });
        toast.success(`${action.userLabel} is ${action.nextStatus === 'suspended' ? 'suspended' : 'active'} now.`, { description: 'Account status change recorded in the audit stream.' });
      } else if (action.kind === 'bulk-role') {
        const result = await bulkUpdateUserRoleMutation.mutateAsync({ userIds: action.userIds, role: action.nextRole });
        toast.success(`${result.count} users promoted.`, { description: 'Bulk role change recorded in the audit stream.' });
      } else {
        const result = await bulkUpdateUserStatusMutation.mutateAsync({ userIds: action.userIds, status: action.nextStatus });
        toast.success(`${result.count} users suspended.`, { description: 'Bulk status change recorded in the audit stream.' });
      }
      setSelectedUserIds([]);
      await Promise.all([refetchUsers(), refetchAuditLogs()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The moderation action could not be completed.');
    } finally {
      setPendingModerationAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0e14] to-[#1a1f2e] p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#ff00cc] mb-2">Owner Control Panel</h1>
          <p className="text-gray-400">Manage your Anom Artsy platform • Real-time stats</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/')} className="text-[#00eaff] border-[#00eaff] hover:bg-[#00eaff]/10 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="grid grid-cols-2 gap-2 mb-8 md:grid-cols-6">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'audit', label: 'Audit Activity', icon: ScrollText },
          { id: 'events', label: 'Events', icon: Package },
          { id: 'settings', label: 'Settings', icon: Settings },
          { id: 'features', label: 'Features', icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'border-[#ff00cc] bg-[#ff00cc]/20 text-[#ff00cc]'
                  : 'border-[#00eaff] bg-transparent text-[#00eaff] hover:bg-[#00eaff]/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-bold">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dashboard Tab - Real-Time Stats */}
      {activeTab === 'dashboard' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="border-2 border-[#ff00cc] bg-[#0b0e14]/80 p-6">
              <div className="text-gray-400 text-sm mb-2">Total Users</div>
              <div className="text-3xl font-bold text-[#ff00cc]">{stats?.totalUsers || 0}</div>
              <div className="text-green-400 text-xs mt-2">↑ {stats?.userGrowth || 0}% this month</div>
            </Card>
            <Card className="border-2 border-[#00eaff] bg-[#0b0e14]/80 p-6">
              <div className="text-gray-400 text-sm mb-2">Active Members</div>
              <div className="text-3xl font-bold text-[#00eaff]">{stats?.activeMembers || 0}</div>
              <div className="text-green-400 text-xs mt-2">↑ {stats?.activeGrowth || 0}% this week</div>
            </Card>
            <Card className="border-2 border-[#a855f7] bg-[#0b0e14]/80 p-6">
              <div className="text-gray-400 text-sm mb-2">Revenue (This Month)</div>
              <div className="text-3xl font-bold text-[#a855f7]">${stats?.monthlyRevenue || 0}</div>
              <div className="text-green-400 text-xs mt-2">↑ {stats?.revenueGrowth || 0}% vs last month</div>
            </Card>
            <Card className="border-2 border-[#fbbf24] bg-[#0b0e14]/80 p-6">
              <div className="text-gray-400 text-sm mb-2">Coins Distributed</div>
              <div className="text-3xl font-bold text-[#fbbf24]">{stats?.coinsDistributed || 0}</div>
              <div className="text-green-400 text-xs mt-2">↑ {stats?.coinsGrowth || 0}% this week</div>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 border-[#00ff88] bg-[#0b0e14]/80 p-6">
              <div className="text-gray-400 text-sm mb-2">Total Lounges</div>
              <div className="text-3xl font-bold text-[#00ff88]">{stats?.totalLounges || 0}</div>
            </Card>
            <Card className="border-2 border-[#ff6b9d] bg-[#0b0e14]/80 p-6">
              <div className="text-gray-400 text-sm mb-2">Merch Orders</div>
              <div className="text-3xl font-bold text-[#ff6b9d]">{stats?.totalOrders || 0}</div>
            </Card>
            <Card className="border-2 border-[#00d4ff] bg-[#0b0e14]/80 p-6">
              <div className="text-gray-400 text-sm mb-2">Achievements Unlocked</div>
              <div className="text-3xl font-bold text-[#00d4ff]">{stats?.achievementsUnlocked || 0}</div>
            </Card>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <h2 className="text-2xl font-bold text-[#ff00cc] mb-4">Manage Users</h2>
          <Card className="border-2 border-[#00eaff] bg-[#0b0e14]/80 p-6">
            <div className="mb-6 space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto] md:items-end">
                <div>
                  <label htmlFor="user-search" className="mb-2 block text-sm font-bold text-gray-300">
                    Search users
                  </label>
                  <Input
                    id="user-search"
                    value={userQuery}
                    onChange={(event) => setUserQuery(event.target.value)}
                    placeholder="Search by name, email, or ID"
                    aria-label="Search users by name, email, or ID"
                    className="bg-[#1a1f2e] border-[#00eaff] text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label htmlFor="user-role-filter" className="mb-2 block text-sm font-bold text-gray-300">
                    Role
                  </label>
                  <select
                    id="user-role-filter"
                    value={userRoleFilter}
                    onChange={(event) => setUserRoleFilter(event.target.value as AdminUserRoleFilter)}
                    className="h-10 w-full rounded-md border border-[#00eaff] bg-[#1a1f2e] px-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#00eaff]"
                  >
                    <option value="all">All roles</option>
                    <option value="admin">Admins</option>
                    <option value="user">Members</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="user-status-filter" className="mb-2 block text-sm font-bold text-gray-300">
                    Activity
                  </label>
                  <select
                    id="user-status-filter"
                    value={userStatusFilter}
                    onChange={(event) => setUserStatusFilter(event.target.value as AdminUserStatusFilter)}
                    className="h-10 w-full rounded-md border border-[#00eaff] bg-[#1a1f2e] px-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#00eaff]"
                  >
                    <option value="all">All activity</option>
                    <option value="active">Active in 30 days</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUserQuery('');
                    setUserRoleFilter('all');
                    setUserStatusFilter('all');
                  }}
                  disabled={!userQuery && userRoleFilter === 'all' && userStatusFilter === 'all'}
                  className="h-10 border-[#ff00cc] text-[#ff00cc] hover:bg-[#ff00cc]/10"
                >
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm" aria-live="polite">
                <p className="text-gray-300">
                  Showing <span className="font-bold text-[#00eaff]">{filteredUsers.length}</span> of {users.length} users
                </p>
                {(userQuery || userRoleFilter !== 'all' || userStatusFilter !== 'all') && (
                  <p className="text-[#ff00cc]">Filters active</p>
                )}
              </div>
            </div>
            {filteredUsers.length > 0 && (
              <div className="flex flex-col gap-3 rounded-lg border border-[#2a2f3e] bg-[#1a1f2e]/70 p-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={toggleAllVisibleUsers}
                    className="border-[#00eaff] text-[#00eaff] hover:bg-[#00eaff]/10"
                    aria-pressed={allVisibleUsersSelected}
                  >
                    {allVisibleUsersSelected ? <CheckSquare className="mr-2 h-4 w-4" /> : <Square className="mr-2 h-4 w-4" />}
                    {allVisibleUsersSelected ? 'Clear visible selection' : 'Select all visible'}
                  </Button>
                  <span className="text-sm text-gray-400" aria-live="polite">
                    {selectedVisibleUserIds.length} selected
                  </span>
                </div>
                <div className="flex flex-col gap-2 min-[420px]:flex-row">
                  <Button
                    type="button"
                    onClick={requestBulkRoleChange}
                    disabled={selectedVisibleUserIds.length === 0 || isModerationPending}
                    className="bg-[#ff00cc] text-black hover:bg-[#ff00cc]/80 disabled:opacity-40"
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Promote selected
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={requestBulkStatusChange}
                    disabled={selectedVisibleUserIds.length === 0 || selectedIncludesCurrentUser || isModerationPending}
                    className="border-[#00eaff] text-[#00eaff] hover:bg-[#00eaff]/10 disabled:opacity-40"
                    title={selectedIncludesCurrentUser ? 'Deselect your own account before suspending users.' : undefined}
                  >
                    Suspend selected
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-3 md:hidden">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const active = isAdminUserActive(u.lastSignedIn);
                  return (
                    <article key={u.id} className="rounded-lg border border-[#2a2f3e] bg-[#1a1f2e] p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(u.id)}
                            onChange={() => toggleUserSelection(u.id)}
                            aria-label={`Select ${u.name || u.email || `user ${u.id}`} for bulk moderation`}
                            className="mt-1 h-4 w-4 accent-[#ff00cc]"
                          />
                          <div>
                            <h3 className="font-bold text-white">{u.name || 'Unnamed user'}</h3>
                            <p className="break-all text-sm text-gray-400">{u.email || 'No email'}</p>
                          </div>
                        </div>
                        <span className="shrink-0 text-xs text-gray-500">#{u.id}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`rounded px-2 py-1 ${u.role === 'admin' ? 'bg-[#ff00cc]/20 text-[#ff00cc]' : 'bg-[#00eaff]/20 text-[#00eaff]'}`}>
                          {u.role}
                        </span>
                        <span className={`rounded px-2 py-1 ${active ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'bg-gray-500/20 text-gray-400'}`}>
                          {active ? 'Active in 30d' : 'Inactive'}
                        </span>
                        <span className={`rounded px-2 py-1 ${u.status === 'suspended' ? 'bg-red-500/20 text-red-300' : 'bg-[#00eaff]/10 text-[#00eaff]'}`}>
                          {u.status === 'suspended' ? 'Suspended' : 'Account active'}
                        </span>
                        <span className="text-gray-500">Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => requestRoleChange(u)}
                          disabled={u.id === user?.id && u.role === 'admin'}
                          aria-label={`${u.role === 'admin' ? 'Demote' : 'Promote'} ${u.name || u.email || `user ${u.id}`}`}
                          className="border-[#ff00cc] text-[#ff00cc] hover:bg-[#ff00cc]/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {u.role === 'admin' ? <ShieldOff className="mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                          {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => requestStatusChange(u)}
                          disabled={u.id === user?.id}
                          aria-label={`${u.status === 'suspended' ? 'Activate' : 'Suspend'} ${u.name || u.email || `user ${u.id}`}`}
                          className="border-[#00eaff] text-[#00eaff] hover:bg-[#00eaff]/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                        </Button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <p className="py-8 text-center text-gray-400">No users match the current search and filters.</p>
              )}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <caption className="sr-only">Filtered Anom Artsy users</caption>
                <thead>
                  <tr className="border-b border-[#2a2f3e]">
                    <th scope="col" className="w-10 py-2 text-left text-[#00eaff]">
                      <input
                        type="checkbox"
                        checked={allVisibleUsersSelected}
                        onChange={toggleAllVisibleUsers}
                        aria-label="Select all visible users for bulk moderation"
                        className="h-4 w-4 accent-[#ff00cc]"
                      />
                    </th>
                    <th scope="col" className="text-left py-2 text-[#00eaff]">User ID</th>
                    <th scope="col" className="text-left py-2 text-[#00eaff]">Name</th>
                    <th scope="col" className="text-left py-2 text-[#00eaff]">Email</th>
                    <th scope="col" className="text-left py-2 text-[#00eaff]">Role</th>
                    <th scope="col" className="text-left py-2 text-[#00eaff]">Activity</th>
                    <th scope="col" className="text-left py-2 text-[#00eaff]">Joined</th>
                    <th scope="col" className="text-left py-2 text-[#00eaff]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => {
                      const active = isAdminUserActive(u.lastSignedIn);
                      return (
                        <tr key={u.id} className="border-b border-[#2a2f3e] hover:bg-[#1a1f2e]">
                          <td className="py-2">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.includes(u.id)}
                              onChange={() => toggleUserSelection(u.id)}
                              aria-label={`Select ${u.name || u.email || `user ${u.id}`} for bulk moderation`}
                              className="h-4 w-4 accent-[#ff00cc]"
                            />
                          </td>
                          <td className="py-2 text-gray-300">{u.id}</td>
                          <td className="py-2 text-gray-300">{u.name || 'Unnamed user'}</td>
                          <td className="py-2 text-gray-300">{u.email || 'No email'}</td>
                          <td className="py-2">
                            <span className={`rounded px-2 py-1 text-xs ${u.role === 'admin' ? 'bg-[#ff00cc]/20 text-[#ff00cc]' : 'bg-[#00eaff]/20 text-[#00eaff]'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2">
                            <span className={`rounded px-2 py-1 text-xs ${active ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'bg-gray-500/20 text-gray-400'}`}>
                              {active ? 'Active' : 'Inactive'}
                            </span>
                            <span className={`ml-2 rounded px-2 py-1 text-xs ${u.status === 'suspended' ? 'bg-red-500/20 text-red-300' : 'bg-[#00eaff]/10 text-[#00eaff]'}`}>
                              {u.status === 'suspended' ? 'Suspended' : 'Account active'}
                            </span>
                          </td>
                          <td className="py-2 text-gray-300">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="py-2">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => requestRoleChange(u)}
                                disabled={u.id === user?.id && u.role === 'admin'}
                                aria-label={`${u.role === 'admin' ? 'Demote' : 'Promote'} ${u.name || u.email || `user ${u.id}`}`}
                                className="border-[#ff00cc] text-[#ff00cc] hover:bg-[#ff00cc]/10 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {u.role === 'admin' ? <ShieldOff className="mr-1 h-3.5 w-3.5" /> : <ShieldCheck className="mr-1 h-3.5 w-3.5" />}
                                {u.role === 'admin' ? 'Demote' : 'Promote'}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => requestStatusChange(u)}
                                disabled={u.id === user?.id}
                                aria-label={`${u.status === 'suspended' ? 'Activate' : 'Suspend'} ${u.name || u.email || `user ${u.id}`}`}
                                className="border-[#00eaff] text-[#00eaff] hover:bg-[#00eaff]/10 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-gray-400">
                        No users match the current search and filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Audit Activity Tab */}
      {activeTab === 'audit' && (
        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-[#ff00cc]">Audit Activity</h2>
              <p className="mt-1 text-sm text-gray-400">Protected record of role and account-status changes.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void refetchAuditLogs()}
              className="border-[#00eaff] text-[#00eaff] hover:bg-[#00eaff]/10"
            >
              Refresh activity
            </Button>
          </div>
          <Card className="border-2 border-[#00eaff] bg-[#0b0e14]/80 p-4 md:p-6">
            {auditLogs.length > 0 ? (
              <div className="space-y-3">
                {auditLogs.map((log) => {
                  const details = log.details && typeof log.details === 'object' ? log.details as Record<string, unknown> : {};
                  const targetEmail = typeof details.targetEmail === 'string' ? details.targetEmail : undefined;
                  const count = typeof details.count === 'number' ? details.count : undefined;
                  return (
                    <article key={log.id} className="rounded-lg border border-[#2a2f3e] bg-[#1a1f2e] p-4 transition-colors hover:border-[#ff00cc]/70">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-semibold capitalize text-[#ff00cc]">{log.action.replaceAll('_', ' ')}</p>
                          <p className="text-sm text-gray-300">
                            By {log.userName || log.userEmail || `Admin #${log.userId ?? 'system'}`}
                            {targetEmail ? ` → ${targetEmail}` : count ? ` → ${count} users` : ''}
                          </p>
                        </div>
                        <time className="text-xs text-gray-500" dateTime={new Date(log.createdAt).toISOString()}>
                          {new Date(log.createdAt).toLocaleString()}
                        </time>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center">
                <ScrollText className="mx-auto mb-3 h-10 w-10 text-[#00eaff]" />
                <p className="text-gray-300">No moderation activity recorded yet.</p>
                <p className="mt-1 text-sm text-gray-500">New role and suspension changes will appear here.</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div>
          <h2 className="text-2xl font-bold text-[#ff00cc] mb-4">Community Highlights & Events</h2>
          
          {/* Create Event Form */}
          <Card className="border-2 border-[#ff00cc] bg-[#0b0e14]/80 p-6 mb-6">
            <h3 className="text-xl font-bold text-[#ff00cc] mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Event
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Event Title</label>
                <Input 
                  value={eventForm.title} 
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="e.g., Tater & Clifford Episode Release"
                  className="bg-[#1a1f2e] border-[#ff00cc] text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Description</label>
                <Textarea 
                  value={eventForm.description} 
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Describe the event..."
                  className="bg-[#1a1f2e] border-[#ff00cc] text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Date & Time</label>
                  <Input 
                    type="datetime-local"
                    value={eventForm.date} 
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="bg-[#1a1f2e] border-[#ff00cc] text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Image URL</label>
                  <Input 
                    value={eventForm.imageUrl} 
                    onChange={(e) => setEventForm({ ...eventForm, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="bg-[#1a1f2e] border-[#ff00cc] text-white"
                  />
                </div>
              </div>
              <Button 
                onClick={handleCreateEvent}
                disabled={createEventMutation.isPending}
                className="w-full bg-[#ff00cc] hover:bg-[#ff00cc]/80 text-black font-bold"
              >
                {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </Card>

          {/* Events List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#00eaff]">Upcoming Events</h3>
            {events && events.length > 0 ? (
              events.map((event: any) => (
                <Card key={event.id} className="border-2 border-[#00eaff] bg-[#0b0e14]/80 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-[#ff00cc] mb-2">{event.title}</h4>
                      <p className="text-gray-300 mb-2">{event.description}</p>
                      <p className="text-[#00eaff] text-sm">📅 {new Date(event.date).toLocaleString()}</p>
                    </div>
                    <Button 
                      variant="destructive"
                      onClick={() => handleDeleteEvent(event.id)}
                      className="ml-4"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="border-2 border-[#00eaff] bg-[#0b0e14]/80 p-6 text-center">
                <p className="text-gray-400">No events yet. Create one to get started!</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div>
          <h2 className="text-2xl font-bold text-[#ff00cc] mb-4">Platform Settings</h2>
          <Card className="border-2 border-[#00eaff] bg-[#0b0e14]/80 p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Site Name</label>
                <Input 
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="bg-[#1a1f2e] border-[#ff00cc] text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Site Description</label>
                <Textarea 
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  className="bg-[#1a1f2e] border-[#ff00cc] text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Max Coins/Day</label>
                  <Input 
                    type="number"
                    value={settings.maxCoinsPerDay}
                    onChange={(e) => setSettings({ ...settings, maxCoinsPerDay: parseInt(e.target.value) })}
                    className="bg-[#1a1f2e] border-[#ff00cc] text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Level Up XP</label>
                  <Input 
                    type="number"
                    value={settings.levelUpXP}
                    onChange={(e) => setSettings({ ...settings, levelUpXP: parseInt(e.target.value) })}
                    className="bg-[#1a1f2e] border-[#ff00cc] text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Achievement Multiplier</label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={settings.achievementMultiplier}
                    onChange={(e) => setSettings({ ...settings, achievementMultiplier: parseFloat(e.target.value) })}
                    className="bg-[#1a1f2e] border-[#ff00cc] text-white"
                  />
                </div>
              </div>
              <Button 
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
                className="w-full bg-[#ff00cc] hover:bg-[#ff00cc]/80 text-black font-bold"
              >
                {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <div>
          <h2 className="text-2xl font-bold text-[#ff00cc] mb-4">Feature Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Social Feed', status: 'active', icon: '📱' },
              { name: 'Lounges', status: 'active', icon: '🏠' },
              { name: 'Merch Shop', status: 'active', icon: '🛍️' },
              { name: 'Games', status: 'active', icon: '🎮' },
              { name: 'Music Platform', status: 'active', icon: '🎵' },
              { name: 'Kids Corner', status: 'active', icon: '👶' },
              { name: 'Collaborations', status: 'active', icon: '🤝' },
              { name: 'Achievements', status: 'active', icon: '🏆' },
            ].map((feature) => (
              <Card key={feature.name} className="border-2 border-[#00eaff] bg-[#0b0e14]/80 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{feature.icon}</span>
                    <div>
                      <p className="font-bold text-[#ff00cc]">{feature.name}</p>
                      <p className="text-xs text-gray-400">Status: {feature.status}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-xs font-bold">
                    {feature.status === 'active' ? '✓ Active' : '○ Inactive'}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <AlertDialog
        open={pendingModerationAction !== null}
        onOpenChange={(open) => {
          if (!open && !isModerationPending) setPendingModerationAction(null);
        }}
      >
        <AlertDialogContent className="border-2 border-[#ff00cc] bg-[#0b0e14] text-white shadow-[0_0_30px_rgba(255,0,204,0.25)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#ff00cc]">
              {pendingModerationAction?.kind === 'role'
                ? `${pendingModerationAction.nextRole === 'admin' ? 'Promote' : 'Demote'} user?`
                : pendingModerationAction?.kind === 'status'
                  ? `${pendingModerationAction.nextStatus === 'suspended' ? 'Suspend' : 'Activate'} user?`
                  : pendingModerationAction?.kind === 'bulk-role'
                    ? `Promote ${pendingModerationAction.userIds.length} selected users?`
                    : `Suspend ${pendingModerationAction?.userIds.length ?? 0} selected users?`}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              {pendingModerationAction?.kind === 'role'
                ? `${pendingModerationAction.userLabel} will ${pendingModerationAction.nextRole === 'admin' ? 'receive' : 'lose'} Owner Control Panel access.`
                : pendingModerationAction?.kind === 'status'
                  ? `${pendingModerationAction.userLabel} will be ${pendingModerationAction.nextStatus === 'suspended' ? 'blocked from active participation' : 'allowed to participate again'}.`
                  : pendingModerationAction?.kind === 'bulk-role'
                    ? `${pendingModerationAction.userIds.length} selected users will receive Owner Control Panel access.`
                    : `${pendingModerationAction?.userIds.length ?? 0} selected users will be blocked from active participation.`}
              {' '}This action is recorded through the protected admin endpoint and written to the audit activity stream.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isModerationPending}
              className="border-[#2a2f3e] bg-transparent text-gray-300 hover:bg-[#1a1f2e] hover:text-white"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isModerationPending}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmModeration();
              }}
              className="bg-[#ff00cc] text-black hover:bg-[#ff00cc]/80"
            >
              {isModerationPending ? 'Applying...' : 'Confirm action'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
