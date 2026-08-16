import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { User, Zap, Award, Palette, Settings, LogOut, Edit2, Save, Share2, Copy, Check, AlertCircle, Bookmark, Play } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import ProfilePhotoManager from "@/components/ProfilePhotoManager";
import IdentitySyncCard from "@/components/IdentitySyncCard";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

const THEME_OPTIONS = [
  { id: "magenta", name: "Neon Magenta", color: "#ff00cc", preview: "🌸" },
  { id: "cyan", name: "Neon Cyan", color: "#00eaff", preview: "💎" },
  { id: "purple", name: "Neon Purple", color: "#b000ff", preview: "👾" },
];

const NAME_COLORS = [
  { id: "#ffffff", name: "White", color: "#ffffff" },
  { id: "#ff00cc", name: "Magenta", color: "#ff00cc" },
  { id: "#00eaff", name: "Cyan", color: "#00eaff" },
  { id: "#b000ff", name: "Purple", color: "#b000ff" },
  { id: "#ffd700", name: "Gold (VIP)", color: "#ffd700" },
  { id: "#c0c0c0", name: "Silver (VIP Max)", color: "#c0c0c0" },
];

export default function Profile() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<"dashboard" | "saved" | "customize" | "settings" | "share">("dashboard");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>("magenta");
  const [selectedNameColor, setSelectedNameColor] = useState<string>("#00eaff");
  const [copied, setCopied] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || "",
    bio: "",
  });

  // Fetch user profile with error handling
  const { data: profile, isLoading: profileLoading, error: profileError } = trpc.profile.getMe.useQuery(undefined, {
    enabled: !!user,
  });

  // Load settings when profile loads
  useEffect(() => {
    if (profile?.neonTheme) setSelectedTheme(profile.neonTheme);
    if (profile?.nameColor) setSelectedNameColor(profile.nameColor);
    setEditData(prev => ({ ...prev, name: user?.name || "", bio: profile?.bio || "" }));
  }, [profile, user?.name]);

  const refreshProfileData = async () => {
    await Promise.all([
      utils.profile.getMe.invalidate(),
      utils.auth.me.invalidate(),
    ]);
  };

  // Mutations
  const updateThemeMutation = trpc.settings.updateTheme.useMutation({ onSuccess: refreshProfileData });
  const updateNameColorMutation = trpc.settings.updateNameColor.useMutation({ onSuccess: refreshProfileData });
  const updateProfileMutation = trpc.profile.updateProfile.useMutation({ onSuccess: refreshProfileData });

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-[#00eaff] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show error state if profile fails to load
  if (profileError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b0e14] to-[#1a1f2e] flex items-center justify-center p-4">
        <Card className="border-2 border-[#ff00cc] bg-[#0b0e14]/80 p-8 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-[#ff00cc]" />
            <h2 className="text-xl font-bold text-[#ff00cc]">Unable to Load Profile</h2>
          </div>
          <p className="text-[#7a7f8e] text-sm mb-6">
            We're having trouble connecting to your profile data. Please try again later.
          </p>
          <div className="flex gap-3">
            <Button 
              onClick={() => window.location.reload()} 
              className="flex-1 bg-[#00eaff] hover:bg-[#00eaff]/80 text-black font-bold"
            >
              Retry
            </Button>
            <Button 
              onClick={() => navigate("/")} 
              className="flex-1 bg-[#ff00cc] hover:bg-[#ff00cc]/80 text-black font-bold"
            >
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-[#00eaff] flex items-center justify-center p-6">
        <Card className="border-2 border-[#ff00cc] bg-[#0b0e14]/80 p-8 text-center max-w-md shadow-[0_0_25px_rgba(255,0,204,0.2)]">
          <h2 className="text-2xl font-bold text-[#ff00cc] mb-3">Sanctuary Profile Access</h2>
          <p className="text-[#7a7f8e] mb-6">Please sign in to view and customize your profile, theme, and badges.</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => startLogin()} className="bg-[#ff00cc] hover:bg-[#cc00a3] text-black font-bold">
              Sign In / Sign Up
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="border-[#00eaff] text-[#00eaff] hover:bg-[#00eaff]/10">
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleUpdateProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        name: editData.name,
        bio: editData.bio,
      });
      toast.success("Profile updated!");
      setIsEditingProfile(false);
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleThemeChange = async (theme: string) => {
    const previousTheme = selectedTheme;
    setSelectedTheme(theme);
    try {
      await updateThemeMutation.mutateAsync({ theme: theme as "magenta" | "cyan" | "purple" });
      toast.success("Theme updated!");
    } catch (error) {
      setSelectedTheme(previousTheme);
      toast.error("Failed to update theme");
    }
  };

  const handleNameColorChange = async (color: string) => {
    const previousNameColor = selectedNameColor;
    setSelectedNameColor(color);
    try {
      await updateNameColorMutation.mutateAsync({ nameColor: color });
      toast.success("Name color updated!");
    } catch (error) {
      setSelectedNameColor(previousNameColor);
      toast.error("Failed to update name color");
    }
  };

  const profileUrl = `${window.location.origin}/profile/${user?.id}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast.success("Profile link copied to clipboard! 📋");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0e14] to-[#1a1f2e] text-[#00eaff]">
      {/* Header */}
      <div className="border-b border-[#2a2f3e] bg-[#0b0e14]/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-[#ff00cc]">My Profile & Hub</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/")} className="text-[#00eaff] border-[#00eaff] hover:bg-[#00eaff]/10">
                ← Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="flex gap-2 mb-8 flex-wrap">
          {[
            { id: "dashboard", label: "Dashboard", icon: "📊" },
            { id: "saved", label: "Saved Reels", icon: "🔖" },
            { id: "customize", label: "Customize", icon: "🎨" },
            { id: "settings", label: "Settings", icon: "⚙️" },
            { id: "share", label: "Share Profile", icon: "📤" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg border-2 font-bold transition-all ${
                activeTab === tab.id
                  ? "border-[#ff00cc] bg-[#ff00cc]/20 text-[#ff00cc]"
                  : "border-[#00eaff] bg-transparent text-[#00eaff] hover:bg-[#00eaff]/10"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-[#1a1f2e] border border-[#2a2f3e] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#7a7f8e] text-sm">Level</p>
                    <p className="text-4xl font-bold text-[#ff00cc]">{profile?.level || 1}</p>
                  </div>
                  <Zap className="w-12 h-12 text-[#ff00cc] opacity-50" />
                </div>
              </Card>

              <Card className="bg-[#1a1f2e] border border-[#2a2f3e] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#7a7f8e] text-sm">Anom Coin Balance</p>
                    <p className="text-4xl font-bold text-[#00eaff]">{profile?.anomCoinBalance || "0"}</p>
                  </div>
                  <Award className="w-12 h-12 text-[#00eaff] opacity-50" />
                </div>
              </Card>
            </div>

            <Card className="bg-[#1a1f2e] border border-[#2a2f3e] p-6">
              <h3 className="text-xl font-bold text-[#ff00cc] mb-4">Bio</h3>
              <p className="text-[#7a7f8e]">{profile?.bio || "No bio yet. Add one in the Customize tab!"}</p>
            </Card>
          </div>
        )}

        {/* Saved Reels Tab */}
        {activeTab === "saved" && (
          <div className="space-y-6">
            <Card className="bg-[#1a1f2e] border border-[#ff00cc]/50 p-6 shadow-[0_0_20px_rgba(255,0,204,0.2)]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-[#ff00cc] flex items-center gap-2">
                  <Bookmark className="w-6 h-6 fill-[#ff00cc]" />
                  Your Saved Reels & Videos
                </h3>
                <Button className="btn-neon-cyan" onClick={() => navigate("/feed")}>
                  Browse More Reels
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sample / Bookmarked Reels Display */}
                <div className="bg-[#0b0e14] border border-[#2a2f3e] rounded-xl p-4 flex gap-4 items-center">
                  <div className="w-24 h-16 bg-gradient-to-br from-[#ff00cc] to-[#00eaff] rounded-lg flex items-center justify-center text-3xl">
                    🎬
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[#00eaff] text-sm mb-1">Pixel & Dot's Full Story</h4>
                    <p className="text-xs text-gray-400 mb-2">Anom Studios · 12,543 views</p>
                    <Button size="sm" className="bg-[#ff00cc] text-black h-7 text-xs font-bold" onClick={() => navigate("/feed")}>
                      <Play className="w-3 h-3 mr-1" /> Watch Now
                    </Button>
                  </div>
                </div>

                <div className="bg-[#0b0e14] border border-[#2a2f3e] rounded-xl p-4 flex gap-4 items-center">
                  <div className="w-24 h-16 bg-gradient-to-br from-[#00ff88] to-[#00eaff] rounded-lg flex items-center justify-center text-3xl">
                    ✨
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[#00eaff] text-sm mb-1">Pixel & Dot: Scene 1</h4>
                    <p className="text-xs text-gray-400 mb-2">Anom Studios · 8,234 views</p>
                    <Button size="sm" className="bg-[#ff00cc] text-black h-7 text-xs font-bold" onClick={() => navigate("/feed")}>
                      <Play className="w-3 h-3 mr-1" /> Watch Now
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Customize Tab */}
        {activeTab === "customize" && (
          <div className="space-y-6">
            <Card className="bg-[#1a1f2e] border border-[#2a2f3e] p-6">
              <h3 className="text-xl font-bold text-[#ff00cc] mb-4">Neon Theme</h3>
              <div className="grid grid-cols-3 gap-4">
                {THEME_OPTIONS.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTheme === theme.id
                        ? "border-[#ff00cc] bg-[#ff00cc]/20"
                        : "border-[#2a2f3e] hover:border-[#ff00cc]"
                    }`}
                  >
                    <div className="text-3xl mb-2">{theme.preview}</div>
                    <p className="text-sm text-[#7a7f8e]">{theme.name}</p>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="bg-[#1a1f2e] border border-[#2a2f3e] p-6">
              <h3 className="text-xl font-bold text-[#ff00cc] mb-4">Name Color</h3>
              <div className="grid grid-cols-3 gap-4">
                {NAME_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => handleNameColorChange(color.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedNameColor === color.id
                        ? "border-[#ff00cc] bg-[#ff00cc]/20"
                        : "border-[#2a2f3e] hover:border-[#ff00cc]"
                    }`}
                  >
                    <div 
                      className="w-8 h-8 rounded-full mx-auto mb-2"
                      style={{ backgroundColor: color.id }}
                    />
                    <p className="text-sm text-[#7a7f8e]">{color.name}</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <Card className="bg-[#1a1f2e] border border-[#2a2f3e] p-6">
              <h3 className="text-xl font-bold text-[#ff00cc] mb-4">Account Settings</h3>
              <p className="text-[#7a7f8e] text-sm mb-4">Manage your Sanctuary credentials and session.</p>
              <Button onClick={() => startLogin()} className="btn-neon-magenta">
                Switch Account / Re-authenticate
              </Button>
            </Card>
          </div>
        )}

        {/* Share Profile Tab */}
        {activeTab === "share" && (
          <div className="space-y-6">
            <Card className="bg-[#1a1f2e] border border-[#00eaff]/50 p-8 shadow-[0_0_20px_rgba(0,234,255,0.2)] text-center">
              <h3 className="text-2xl font-bold text-[#00eaff] mb-3">Share Your Sanctuary Profile</h3>
              <p className="text-[#7a7f8e] max-w-md mx-auto mb-6">
                Invite friends and fellow explorers to view your progress, achievement badges, and neon theme.
              </p>
              <div className="flex max-w-md mx-auto gap-2 mb-6">
                <input
                  type="text"
                  readOnly
                  value={profileUrl}
                  className="flex-1 bg-[#0b0e14] border border-[#2a2f3e] rounded-lg px-4 py-2 text-sm text-[#00eaff]"
                />
                <Button onClick={handleCopyLink} className="btn-neon-cyan">
                  {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
