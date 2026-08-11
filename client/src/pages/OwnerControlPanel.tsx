import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLocation } from 'wouter';
import { useDeferredValue, useMemo, useState } from 'react';
import {
  filterAdminUsers,
  isAdminUserActive,
  type AdminUserRoleFilter,
  type AdminUserStatusFilter,
} from '../../../shared/adminUserFilters';
import { Settings, Users, BarChart3, Package, Zap, Lock, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OwnerControlPanel() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const requestedTab = new URLSearchParams(window.location.search).get('tab');
    return ['dashboard', 'users', 'events', 'settings', 'features'].includes(requestedTab ?? '')
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

  // Real-time data queries
  const { data: stats } = trpc.system.getStats.useQuery(undefined, { refetchInterval: 5000 });
  const { data: users = [] } = trpc.system.getAllUsers.useQuery(undefined, { refetchInterval: 10000 });
  const { data: events = [] } = trpc.system.getEvents.useQuery(undefined, { refetchInterval: 5000 });
  const filteredUsers = useMemo(
    () =>
      filterAdminUsers(users, {
        query: deferredUserQuery,
        role: userRoleFilter,
        status: userStatusFilter,
      }),
    [users, deferredUserQuery, userRoleFilter, userStatusFilter],
  );

  // Mutations
  const updateSettingsMutation = trpc.system.updateSettings.useMutation();
  const createEventMutation = trpc.system.createEvent.useMutation();
  const deleteEventMutation = trpc.system.deleteEvent.useMutation();

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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-8">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'users', label: 'Users', icon: Users },
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
            <div className="space-y-3 md:hidden">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const active = isAdminUserActive(u.lastSignedIn);
                  return (
                    <article key={u.id} className="rounded-lg border border-[#2a2f3e] bg-[#1a1f2e] p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-white">{u.name || 'Unnamed user'}</h3>
                          <p className="break-all text-sm text-gray-400">{u.email || 'No email'}</p>
                        </div>
                        <span className="shrink-0 text-xs text-gray-500">#{u.id}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`rounded px-2 py-1 ${u.role === 'admin' ? 'bg-[#ff00cc]/20 text-[#ff00cc]' : 'bg-[#00eaff]/20 text-[#00eaff]'}`}>
                          {u.role}
                        </span>
                        <span className={`rounded px-2 py-1 ${active ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'bg-gray-500/20 text-gray-400'}`}>
                          {active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-gray-500">Joined {new Date(u.createdAt).toLocaleDateString()}</span>
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
                    <th scope="col" className="text-left py-2 text-[#00eaff]">User ID</th>
                    <th scope="col" className="text-left py-2 text-[#00eaff]">Name</th>
                    <th scope="col" className="text-left py-2 text-[#00eaff]">Email</th>
                    <th scope="col" className="text-left py-2 text-[#00eaff]">Role</th>
                    <th scope="col" className="text-left py-2 text-[#00eaff]">Activity</th>
                    <th scope="col" className="text-left py-2 text-[#00eaff]">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => {
                      const active = isAdminUserActive(u.lastSignedIn);
                      return (
                        <tr key={u.id} className="border-b border-[#2a2f3e] hover:bg-[#1a1f2e]">
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
                          </td>
                          <td className="py-2 text-gray-300">{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-gray-400">
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
    </div>
  );
}
