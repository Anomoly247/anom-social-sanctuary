import { Button } from "@/components/ui/button";
import { Zap, Users, Gamepad2, Heart, Sparkles, Upload, Palette, ThumbsUp, Star, Award } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";
import SignUpConnectors from "@/components/SignUpConnectors";
import HomepageIntegration from "@/components/HomepageIntegration";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: userProfile } = trpc.profile.getMe.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: activityEvents = [] } = trpc.activityFeed.list.useQuery({ limit: 15 }, { refetchInterval: 5000 });

  const likeMutation = trpc.activityFeed.like.useMutation({
    onSuccess: () => {
      toast.success("Liked! +5 Anom Coins earned! 🪙");
      utils.activityFeed.list.invalidate();
    },
  });

  const rateMutation = trpc.activityFeed.rate.useMutation({
    onSuccess: () => {
      toast.success("Rated! +10 Anom Coins earned! 🪙");
      utils.activityFeed.list.invalidate();
    },
  });

  const userTheme = userProfile?.neonTheme || "cyan";
  const userAccent = userTheme === "magenta" ? "#ff00cc" : userTheme === "gold" ? "#ffd700" : userTheme === "purple" ? "#b000ff" : "#00eaff";

  const [achievementColor, setAchievementColor] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('achievementShowcaseColor') || '#ffd700';
    }
    return '#ffd700';
  });

  const [backgroundUrl, setBackgroundUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('homepageBackground') || '';
    }
    return '';
  });
  const [showBgMenu, setShowBgMenu] = useState(false);
  const [showColorCustomizer, setShowColorCustomizer] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070a] flex items-center justify-center">
        <div className="text-[#00eaff] text-xl font-bold animate-pulse">Loading Anom Sanctuary...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#05070a] text-[#00eaff] flex flex-col">
        {/* Navigation */}
        <nav className="border-b border-[#2a2f3e] px-6 py-4 bg-[#05070a]/95">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="text-2xl font-bold text-[#00eaff] tracking-wider">ANOM ARTSY</div>
            <Button onClick={startLogin} className="btn-neon-cyan">Sign In</Button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="flex-1 px-6 py-20">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-6 inline-block bg-[#00eaff]/10 border border-[#00eaff] rounded-lg px-4 py-2">
                <p className="text-[#00eaff] font-bold text-sm">✨ Black, Cyan, Magenta & Gold Sanctuary</p>
              </div>
              <h1 className="text-5xl font-bold mb-6">
                <span className="text-[#00eaff]">Identity</span>
                <span className="text-white">, Amplified</span>
              </h1>
              <p className="text-lg text-gray-400 mb-8">
                Welcome to Anom Sanctuary — a refined, easy-on-the-eyes dark sanctuary where family, art, and community thrive. Rate, like, and earn Anom Coins with every interaction.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={startLogin} className="btn-neon-cyan text-lg py-6 px-8">
                  Enter the Sanctuary
                </Button>
                <a href="/mission-hub">
                  <Button className="btn-neon-magenta text-lg py-6 px-8">
                    Explore the Mission
                  </Button>
                </a>
              </div>
            </div>
            <SignUpConnectors />
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#2a2f3e] px-6 py-8 text-center text-gray-500">
          <p>&copy; 2026 Anom Artsy. Identity, Amplified.</p>
        </footer>
      </div>
    );
  }

  const handlePresetBackground = (preset: string) => {
    const presets: Record<string, string> = {
      cyan: 'linear-gradient(135deg, rgba(0, 234, 255, 0.08) 0%, rgba(5, 7, 10, 0.95) 100%)',
      magenta: 'linear-gradient(135deg, rgba(255, 0, 204, 0.08) 0%, rgba(5, 7, 10, 0.95) 100%)',
      gold: 'linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(5, 7, 10, 0.95) 100%)',
    };
    setBackgroundUrl(presets[preset] || '');
    localStorage.setItem('homepageBackground', presets[preset] || '');
    toast.success('Background preset applied!');
    setShowBgMenu(false);
  };

  return (
    <div 
      className="min-h-screen bg-[#05070a] text-[#00eaff]"
      style={{
        backgroundImage: backgroundUrl.startsWith('linear-gradient') ? backgroundUrl : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-[#2a2f3e] bg-[#05070a]/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="text-2xl font-bold tracking-wider text-[#00eaff]">ANOM SANCTUARY</div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden sm:inline">Welcome, {user?.name}</span>
            <div className="relative">
              <Button 
                onClick={() => setShowBgMenu(!showBgMenu)}
                className="bg-[#1a1f2e] border border-[#00eaff]/40 text-[#00eaff] hover:bg-[#00eaff]/10"
                size="sm"
              >
                <Palette className="w-4 h-4 mr-2" />
                Theme
              </Button>
              {showBgMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg p-3 shadow-2xl z-50">
                  <div className="space-y-2">
                    <button onClick={() => handlePresetBackground('cyan')} className="w-full text-left px-3 py-1.5 rounded hover:bg-[#2a2f3e] text-[#00eaff] text-sm">Cyan Ambient</button>
                    <button onClick={() => handlePresetBackground('magenta')} className="w-full text-left px-3 py-1.5 rounded hover:bg-[#2a2f3e] text-[#ff00cc] text-sm">Magenta Glow</button>
                    <button onClick={() => handlePresetBackground('gold')} className="w-full text-left px-3 py-1.5 rounded hover:bg-[#2a2f3e] text-[#ffd700] text-sm">Gold Radiance</button>
                  </div>
                </div>
              )}
            </div>
            {user?.role === 'admin' && (
              <Button onClick={() => navigate('/owner')} className="btn-neon-magenta" size="sm">
                Owner Panel
              </Button>
            )}
            <Button variant="outline" onClick={logout} className="border-[#00eaff] text-[#00eaff] hover:bg-[#00eaff]/10" size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Top Stats Bar */}
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-[#1a1f2e] border border-[#2a2f3e] rounded-xl p-5 shadow-lg" style={{boxShadow: '0 0 20px rgba(0, 234, 255, 0.1)'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Anom Coin Balance</p>
                <p className="text-3xl font-bold text-[#ffd700] mt-1">250 AC</p>
              </div>
              <Zap className="w-9 h-9 text-[#ffd700]" />
            </div>
          </div>
          <div className="bg-[#1a1f2e] border border-[#2a2f3e] rounded-xl p-5 shadow-lg" style={{boxShadow: '0 0 20px rgba(255, 0, 204, 0.1)'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Sanctuary Level</p>
                <p className="text-3xl font-bold text-[#ff00cc] mt-1">Level 2</p>
              </div>
              <Sparkles className="w-9 h-9 text-[#ff00cc]" />
            </div>
          </div>
          <div className="bg-[#1a1f2e] border border-[#2a2f3e] rounded-xl p-5 shadow-lg" style={{boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Lounges</p>
                <p className="text-3xl font-bold text-[#00eaff] mt-1">3 Lounges</p>
              </div>
              <Users className="w-9 h-9 text-[#00eaff]" />
            </div>
          </div>
          <div className="bg-[#1a1f2e] border border-[#2a2f3e] rounded-xl p-5 shadow-lg" style={{boxShadow: '0 0 20px rgba(157, 78, 221, 0.1)'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Achievements</p>
                <p className="text-3xl font-bold text-[#9d4edd] mt-1">5 Unlocked</p>
              </div>
              <Award className="w-9 h-9 text-[#9d4edd]" />
            </div>
          </div>
        </div>

        {/* Achievement Showcase Customizer */}
        <div className="bg-[#1a1f2e] border border-[#2a2f3e] rounded-xl p-6" style={{ borderColor: achievementColor }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: achievementColor }}>
                <Award className="w-6 h-6" />
                Achievement Reward Showcase
              </h2>
              <p className="text-gray-400 text-sm">Customize the neon glow color of your earned achievement badges.</p>
            </div>
            <div className="flex gap-2">
              {['#ffd700', '#00eaff', '#ff00cc', '#9d4edd', '#00ff88'].map((col) => (
                <button
                  key={col}
                  onClick={() => {
                    setAchievementColor(col);
                    localStorage.setItem('achievementShowcaseColor', col);
                    toast.success("Showcase color updated!");
                  }}
                  className={`w-8 h-8 rounded-full border-2 ${achievementColor === col ? 'scale-110 border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: col }}
                  title={`Select ${col}`}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="bg-[#05070a] p-3 rounded-lg border text-center" style={{ borderColor: achievementColor }}>
              <span className="text-2xl">👑</span>
              <p className="text-xs font-bold mt-1" style={{ color: achievementColor }}>Founding Member</p>
            </div>
            <div className="bg-[#05070a] p-3 rounded-lg border text-center" style={{ borderColor: achievementColor }}>
              <span className="text-2xl">💬</span>
              <p className="text-xs font-bold mt-1" style={{ color: achievementColor }}>Lounge Catalyst</p>
            </div>
            <div className="bg-[#05070a] p-3 rounded-lg border text-center" style={{ borderColor: achievementColor }}>
              <span className="text-2xl">🪙</span>
              <p className="text-xs font-bold mt-1" style={{ color: achievementColor }}>Coin Master</p>
            </div>
            <div className="bg-[#05070a] p-3 rounded-lg border text-center" style={{ borderColor: achievementColor }}>
              <span className="text-2xl">✨</span>
              <p className="text-xs font-bold mt-1" style={{ color: achievementColor }}>VIP Pioneer</p>
            </div>
          </div>
        </div>

        {/* Quick Actions & Activity Feed */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Navigation */}
          <div className="bg-[#1a1f2e] border border-[#2a2f3e] rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#00eaff]">Sanctuary Portals</h3>
            <div className="space-y-3">
              <Button onClick={() => navigate("/lounges")} className="w-full btn-neon-cyan justify-start">
                👥 Lounges & Chat Rooms
              </Button>
              <Button onClick={() => navigate("/profile")} className="w-full btn-neon-magenta justify-start">
                🎨 Profile & Theme Settings
              </Button>
              <Button onClick={() => navigate("/achievements")} className="w-full btn-neon-gold justify-start">
                🏆 Achievements & Badges
              </Button>
              <Button onClick={() => navigate("/feed")} className="w-full bg-[#1a1f2e] border border-[#00eaff] text-[#00eaff] hover:bg-[#00eaff]/10 justify-start font-bold">
                🌍 Community Social Feed
              </Button>
              <Button onClick={() => navigate("/games")} className="w-full bg-[#1a1f2e] border border-[#ff00cc] text-[#ff00cc] hover:bg-[#ff00cc]/10 justify-start font-bold">
                🎮 Mini-Games & Coin Vault
              </Button>
              <Button onClick={() => navigate("/merch")} className="w-full bg-[#1a1f2e] border border-[#ffd700] text-[#ffd700] hover:bg-[#ffd700]/10 justify-start font-bold">
                🛍️ Custom Merch Store
              </Button>
            </div>
          </div>

          {/* Community Activity Feed with Rate & Like System */}
          <div className="lg:col-span-2 bg-[#1a1f2e] border border-[#2a2f3e] rounded-xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#00eaff]">Live Activity Feed & Milestones</h3>
                <p className="text-xs text-gray-400">Rate and like member milestones to earn Anom Coins! 🪙</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#00eaff]/10 text-[#00eaff] border border-[#00eaff]/30">Live Stream</span>
            </div>

            <div className="flex-1 space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {activityEvents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No activity recorded yet. Start chatting or create a lounge to broadcast milestones!</p>
                </div>
              ) : (
                activityEvents.map((evt: any) => (
                  <div key={evt.id} className="bg-[#05070a] border border-[#2a2f3e] rounded-lg p-4 space-y-3 hover:border-[#00eaff]/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-[#ff00cc]/10 text-[#ff00cc] font-bold">
                            {evt.category.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400">by {evt.user?.name || "Member"}</span>
                        </div>
                        <h4 className="text-white font-bold text-base mt-1">{evt.title}</h4>
                        <p className="text-gray-300 text-sm mt-1">{evt.description}</p>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(evt.createdAt).toLocaleTimeString()}</span>
                    </div>

                    {/* Rate & Like Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#2a2f3e]/60">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => likeMutation.mutate({ eventId: evt.id })}
                          className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-[#ff00cc] transition-colors bg-[#1a1f2e] px-3 py-1.5 rounded-lg border border-[#2a2f3e]"
                        >
                          <ThumbsUp className="w-3.5 h-3.5 text-[#ff00cc]" />
                          <span>Like ({evt.likesCount || 0})</span>
                        </button>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Star className="w-3.5 h-3.5 text-[#ffd700]" />
                          <span>
                            {evt.ratingCount > 0 ? (evt.ratingSum / evt.ratingCount).toFixed(1) : 'No ratings'} ({evt.ratingCount})
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => rateMutation.mutate({ eventId: evt.id, rating: star })}
                            className="text-xs text-gray-500 hover:text-[#ffd700] transition-transform hover:scale-125 px-1"
                            title={`Rate ${star} stars`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Homepage Integration */}
        <div className="pt-4">
          <HomepageIntegration />
        </div>
      </main>
    </div>
  );
}
