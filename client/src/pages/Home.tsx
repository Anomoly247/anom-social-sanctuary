import { Button } from "@/components/ui/button";
import { Zap, Users, Gamepad2, Heart, Sparkles, Upload, Palette } from "lucide-react";
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
  const { data: userProfile } = trpc.profile.getMe.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const userAccent = userProfile?.neonTheme === "cyan" ? "#00eaff" : userProfile?.neonTheme === "purple" ? "#b000ff" : "#ff00cc";
  const [backgroundUrl, setBackgroundUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('homepageBackground') || '';
    }
    return '';
  });
  const [showBgMenu, setShowBgMenu] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">
        <div className="text-[#00eaff] text-xl">Loading Anom Artsy...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-[#00eaff] flex flex-col">
        {/* Navigation */}
        <nav className="border-b border-[#2a2f3e] px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="text-2xl font-bold text-[#00eaff]">Anom Artsy</div>
            <Button onClick={startLogin} className="bg-[#00eaff] hover:bg-[#00eaff]/80 text-black font-bold">Sign In</Button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="flex-1 px-6 py-20">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-6 inline-block bg-[#00eaff]/20 border border-[#00eaff] rounded-lg px-4 py-2">
                <p className="text-[#00eaff] font-bold text-sm">🌍 Social Good First</p>
              </div>
              <h1 className="text-5xl font-bold mb-6">
                <span className="text-[#00eaff]">Identity</span>
                <span className="text-white">, Amplified</span>
              </h1>
              <p className="text-lg text-[#7a7f8e] mb-8">
                Join the Anom Artsy community — a cyan-lit sanctuary where family comes first, creativity thrives, and your identity matters. Every interaction drives real-world social good impact.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={startLogin} className="bg-[#00eaff] hover:bg-[#00eaff]/80 text-black font-bold text-lg py-6 px-8">
                  Enter the Universe
                </Button>
                <a href="/mission-hub">
                  <Button className="bg-[#1a1f2e] border border-[#ff00cc] text-[#ff00cc] hover:bg-[#ff00cc]/20 font-bold text-lg py-6 px-8">
                    Explore the Mission
                  </Button>
                </a>
              </div>
            </div>
            <SignUpConnectors />
          </div>
        </section>

        {/* Mission Section */}
        <section className="bg-gradient-to-r from-[#00eaff]/10 to-[#1a1f2e] border-t border-[#00eaff]/30 px-6 py-16">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              <span className="text-[#00eaff]">Social Good</span>
              <span className="text-white"> Meets </span>
              <span className="text-[#ff00cc]">Creative Power</span>
            </h2>
            <p className="text-[#7a7f8e] max-w-2xl mx-auto mb-6">
              Every coin earned, every collaboration started, every voice amplified—it all drives real impact. Join artists, creators, and visionaries building a better world together.
            </p>
            <a href="/mission-hub">
              <Button className="bg-[#ff00cc] hover:bg-[#ff00cc]/80 text-black font-bold text-lg py-4 px-8">
                Explore the Mission
              </Button>
            </a>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-[#0b0e14] border-t border-[#2a2f3e] px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16 text-[#00eaff]">
              What Awaits You
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-[#1a1f2e] border border-[#00eaff]/30 rounded-lg p-6" style={{boxShadow: '0 0 15px rgba(0, 234, 255, 0.15)'}}>
                <Zap className="w-8 h-8 text-[#00eaff] mb-4" />
                <h3 className="text-xl font-bold text-[#00eaff] mb-2">Anom Coin Economy</h3>
                <p className="text-[#7a7f8e]">
                  Earn coins through social good actions, games, and community engagement. Spend them on profile decorations and exclusive lounges.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-[#1a1f2e] border border-[#00eaff]/30 rounded-lg p-6" style={{boxShadow: '0 0 15px rgba(0, 234, 255, 0.15)'}}>
                <Users className="w-8 h-8 text-[#00eaff] mb-4" />
                <h3 className="text-xl font-bold text-[#00eaff] mb-2">Private Lounges</h3>
                <p className="text-[#7a7f8e]">
                  Create family, friend, and coworker lounges. Chat, share goals, and customize your space with neon themes.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-[#1a1f2e] border border-[#00eaff]/30 rounded-lg p-6" style={{boxShadow: '0 0 15px rgba(0, 234, 255, 0.15)'}}>
                <Gamepad2 className="w-8 h-8 text-[#00eaff] mb-4" />
                <h3 className="text-xl font-bold text-[#00eaff] mb-2">Mini-Games</h3>
                <p className="text-[#7a7f8e]">
                  Play Trivia, Memory, Mood Matcher, and Snack Vault Rush. Earn coins and climb the leaderboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#2a2f3e] px-6 py-8 text-center text-[#7a7f8e]">
          <p>&copy; 2026 Anom Artsy. Identity, Amplified.</p>
        </footer>
      </div>
    );
  }

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setBackgroundUrl(url);
        localStorage.setItem('homepageBackground', url);
        toast.success('Background updated!');
        setShowBgMenu(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetBackground = (preset: string) => {
    const presets: Record<string, string> = {
      gradient1: 'linear-gradient(135deg, rgba(0, 234, 255, 0.1) 0%, rgba(11, 14, 20, 0.9) 100%)',
      gradient2: 'linear-gradient(135deg, rgba(176, 0, 255, 0.1) 0%, rgba(11, 14, 20, 0.9) 100%)',
      gradient3: 'linear-gradient(135deg, rgba(0, 234, 255, 0.1) 0%, rgba(0, 255, 136, 0.1) 100%)',
    };
    setBackgroundUrl(presets[preset] || '');
    localStorage.setItem('homepageBackground', presets[preset] || '');
    toast.success('Background preset applied!');
    setShowBgMenu(false);
  };

  // Authenticated Dashboard
  return (
    <div 
      className="min-h-screen bg-[#0b0e14] text-[#00eaff]"
      style={{
        backgroundImage: backgroundUrl.startsWith('linear-gradient') ? backgroundUrl : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {backgroundUrl && !backgroundUrl.startsWith('linear-gradient') && (
        <div 
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `url(${backgroundUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
          }}
        />
      )}
      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-[#2a2f3e] bg-[#0b0e14]/95 px-3 py-3 backdrop-blur sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="shrink-0 text-xl font-bold text-[#00eaff] sm:text-2xl">Anom Artsy</div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-4">
            <span className="col-span-2 min-w-0 truncate text-xs text-[#7a7f8e] sm:col-span-1 sm:text-sm">Welcome, {user?.name}</span>
            <div className="relative min-w-0">
              <Button 
                onClick={() => setShowBgMenu(!showBgMenu)}
                className="w-full bg-[#00eaff]/20 text-[#00eaff] hover:bg-[#00eaff]/30 sm:w-auto"
                size="sm"
              >
                <Palette className="w-4 h-4 mr-2" />
                Background
              </Button>
              {showBgMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg p-4 shadow-lg z-50">
                  <div className="space-y-2">
                    <button
                      onClick={() => handlePresetBackground('gradient1')}
                      className="w-full text-left px-3 py-2 rounded hover:bg-[#2a2f3e] text-[#00eaff] text-sm"
                    >
                      Cyan Glow
                    </button>
                    <button
                      onClick={() => handlePresetBackground('gradient2')}
                      className="w-full text-left px-3 py-2 rounded hover:bg-[#2a2f3e] text-[#00eaff] text-sm"
                    >
                      Purple Ambient
                    </button>
                    <button
                      onClick={() => handlePresetBackground('gradient3')}
                      className="w-full text-left px-3 py-2 rounded hover:bg-[#2a2f3e] text-[#00eaff] text-sm"
                    >
                      Cyan-Green
                    </button>
                    <label className="w-full text-left px-3 py-2 rounded hover:bg-[#2a2f3e] text-[#00eaff] text-sm cursor-pointer flex items-center">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBackgroundUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
            {user?.role === 'admin' && (
              <Button onClick={() => navigate('/owner')} className="w-full bg-[#a855f7] font-bold text-white hover:bg-[#a855f7]/80 sm:w-auto">
                Owner Panel
              </Button>
            )}
            <Button variant="outline" onClick={logout} className="w-full text-[#00eaff] border-[#00eaff] sm:w-auto">
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {/* Coin Balance */}
          <div className="bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg p-4" style={{boxShadow: `0 0 15px ${userAccent}33`}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#7a7f8e] text-sm">Anom Coin Balance</p>
                <p className="text-3xl font-bold" style={{ color: userAccent }}>0 AC</p>
              </div>
              <Zap className="w-8 h-8" style={{ color: userAccent }} />
            </div>
          </div>

          {/* Level */}
          <div className="bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg p-4" style={{boxShadow: '0 0 15px rgba(0, 234, 255, 0.15)'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#7a7f8e] text-sm">Your Level</p>
                <p className="text-3xl font-bold text-[#00eaff]">1</p>
              </div>
              <Sparkles className="w-8 h-8 text-[#00eaff]" />
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg p-4" style={{boxShadow: '0 0 15px rgba(0, 234, 255, 0.15)'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#7a7f8e] text-sm">Achievements</p>
                <p className="text-3xl font-bold text-[#00eaff]">0</p>
              </div>
              <Heart className="w-8 h-8 text-[#00eaff]" />
            </div>
          </div>

          {/* Lounges */}
          <div className="bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg p-4" style={{boxShadow: '0 0 15px rgba(0, 234, 255, 0.15)'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#7a7f8e] text-sm">Your Lounges</p>
                <p className="text-3xl font-bold text-[#00eaff]">0</p>
              </div>
              <Users className="w-8 h-8 text-[#00eaff]" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg p-6" style={{boxShadow: '0 0 15px rgba(0, 234, 255, 0.15)'}}>
            <h3 className="text-xl font-bold mb-4" style={{ color: userAccent }}>Quick Actions</h3>
            <div className="space-y-3">
              <Button style={{ backgroundColor: userAccent, color: '#000' }} className="w-full font-bold" onClick={() => navigate("/profile")}>
                View Profile & Theme Settings
              </Button>
              <Button className="w-full bg-[#00eaff] hover:bg-[#00eaff]/80 text-black font-bold" onClick={() => navigate("/lounges")}>
                Browse Lounges
              </Button>
              <Button className="w-full bg-[#1a1f2e] border border-[#00eaff] text-[#00eaff] hover:bg-[#00eaff]/10 font-bold" onClick={() => navigate("/achievements")}>
                View Achievements
              </Button>
              <Button className="w-full bg-[#1a1f2e] border border-[#00eaff] text-[#00eaff] hover:bg-[#00eaff]/10 font-bold" onClick={() => navigate("/kids-corner")}>
                Anom's Corner
              </Button>
              <Button className="w-full bg-[#1a1f2e] border border-[#00eaff] text-[#00eaff] hover:bg-[#00eaff]/10 font-bold" onClick={() => navigate("/feed")}>
                Social Feed
              </Button>
              <Button className="w-full bg-[#1a1f2e] border border-[#00eaff] text-[#00eaff] hover:bg-[#00eaff]/10 font-bold" onClick={() => navigate("/games")}>
                Play Games
              </Button>
              <Button className="w-full bg-[#1a1f2e] border border-[#00eaff] text-[#00eaff] hover:bg-[#00eaff]/10 font-bold" onClick={() => navigate("/merch")}>
                Custom Merch
              </Button>
              <Button className="w-full bg-[#1a1f2e] border border-[#00eaff] text-[#00eaff] hover:bg-[#00eaff]/10 font-bold" onClick={() => navigate("/collaboration")}>
                Collaboration Station
              </Button>
            </div>
          </div>

          <div className="bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg p-6" style={{boxShadow: '0 0 15px rgba(0, 234, 255, 0.15)'}}>
            <h3 className="text-xl font-bold text-[#00eaff] mb-4">Live from the Universe</h3>
            <p className="text-[#7a7f8e] text-sm">
              Check back soon for community highlights, memes, and universe updates!
            </p>
          </div>
        </div>

        {/* Homepage Integration */}
        <div className="mt-12">
          <HomepageIntegration />
        </div>
      </main>
    </div>
  );
}
