import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Award, Star, Trophy, Heart } from "lucide-react";
import { startLogin } from "@/const";

export default function Achievements() {
  const { user, isAuthenticated } = useAuth();
  const { data: profileData } = trpc.profile.getMe.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: allAchievements } = trpc.achievement.getAll.useQuery();
  const { data: userAchievements } = trpc.achievement.getUserAchievements.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md bg-[#121620] border-2 border-[#00eaff] rounded-xl p-8 shadow-[0_0_25px_rgba(0,234,255,0.2)]">
          <h2 className="text-2xl font-bold text-[#00eaff] mb-3">Sanctuary Access</h2>
          <p className="text-[#7a7f8e] mb-6">Sign in to view your achievements, level up, and earn Anom Coins.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => startLogin()}
              className="px-6 py-3 rounded-lg font-bold text-black bg-[#00eaff] hover:bg-[#00b8cc] transition-all shadow-[0_0_15px_rgba(0,234,255,0.4)] cursor-pointer"
            >
              Sign In / Sign Up
            </button>
            <button
              onClick={() => window.location.href = "/"}
              className="px-6 py-3 rounded-lg font-bold text-white border border-[#ff00cc] hover:bg-[#ff00cc]/10 transition-all cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const level = profileData?.level || 1;
  const xp = profileData?.xp || 0;
  const xpPerLevel = 100;
  const xpProgress = (xp / xpPerLevel) * 100;

  const unlockedIds = new Set(userAchievements?.map((a) => a.achievementId) || []);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-[#00eaff] mb-2">Achievements & Progress</h1>
            <p className="text-[#7a7f8e]">Track your journey and unlock badges</p>
          </div>
          <button
            onClick={() => window.location.href = "/"}
            className="btn-neon-cyan px-4 py-2 rounded-lg text-sm flex items-center gap-2 cursor-pointer"
          >
            🏠 Back to Home
          </button>
        </div>

        {/* Level Card */}
        <div
          className="rounded-lg border-2 border-[#00eaff] p-8 mb-8"
          style={{
            boxShadow: "0 0 20px rgba(0, 234, 255, 0.3)",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[#7a7f8e] text-sm mb-2">Current Level</p>
              <p className="text-5xl font-bold text-[#00eaff]">{level}</p>
            </div>
            <Trophy className="w-24 h-24 text-[#00eaff] opacity-50" />
          </div>

          {/* XP Progress Bar */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-[#7a7f8e] text-sm">Experience Points</span>
              <span className="text-[#ff00cc] font-bold">
                {xp} / {xpPerLevel}
              </span>
            </div>
            <div className="w-full bg-[#1e2330] h-4 rounded-full overflow-hidden p-0.5 border border-[#00eaff]/30">
              <div
                className="bg-gradient-to-r from-[#00eaff] to-[#ff00cc] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(xpProgress, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        <h2 className="text-2xl font-bold text-[#ff00cc] mb-6">Badge Gallery</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allAchievements?.map((achievement) => {
            const isUnlocked = unlockedIds.has(achievement.id);
            return (
              <div
                key={achievement.id}
                className={`p-6 rounded-xl border-2 transition-all ${
                  isUnlocked
                    ? "border-[#00eaff] bg-[#121620] shadow-[0_0_15px_rgba(0,234,255,0.15)]"
                    : "border-[#2a3042] bg-[#0b0e14]/50 opacity-60"
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${isUnlocked ? "bg-[#00eaff]/20 text-[#00eaff]" : "bg-[#2a3042] text-[#7a7f8e]"}`}>
                    <Award className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">{achievement.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${isUnlocked ? "bg-[#00eaff]/20 text-[#00eaff]" : "bg-[#2a3042] text-[#7a7f8e]"}`}>
                      {isUnlocked ? "Unlocked" : "Locked"}
                    </span>
                  </div>
                </div>
                <p className="text-[#7a7f8e] text-sm">{achievement.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
