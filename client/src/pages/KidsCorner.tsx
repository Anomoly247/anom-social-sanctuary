import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Palette, Gamepad2, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";

const PIXEL_DOT_RAW_ASSET_BASE = "https://raw.githubusercontent.com/Anoms-Hub/anom-artsy/main/assets";

// Video Player Component
function VideoPlayer({ videoUrl, title, onClose }: { videoUrl: string; title: string; onClose: () => void }) {
  const isYouTubeEmbed = videoUrl.includes("youtube.com/embed/");

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <Card className="bg-[#1a1f2e] border border-[#ff00cc] w-full max-w-4xl overflow-hidden neon-glow-magenta">
        <div className="relative">
          <div className="aspect-video bg-black flex items-center justify-center">
            {isYouTubeEmbed ? (
              <iframe
                key={videoUrl}
                width="100%"
                height="100%"
                src={videoUrl}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              <video
                key={videoUrl}
                controls
                autoPlay
                className="w-full h-full"
              >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
          <div className="p-4 bg-[#1a1f2e] flex justify-between items-center border-t border-[#2a2f3e]">
            <h2 className="text-xl font-bold text-[#ff00cc] truncate mr-4">{title}</h2>
            <Button className="btn-neon-cyan" onClick={onClose}>
              Close Player
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Coloring Page Component
function ColoringPage({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [selectedColor, setSelectedColor] = useState("#ff00cc");
  const colors = ["#ff00cc", "#00eaff", "#9d4edd", "#ffd60a", "#3a86ff", "#fb5607"];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="bg-[#1a1f2e] border border-[#ff00cc] w-full max-w-2xl">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-[#ff00cc] mb-4">Pixel's Coloring Page</h2>

          {/* SVG Canvas */}
          <div className="bg-white rounded-lg p-4 mb-4">
            <svg width="100%" height="300" viewBox="0 0 300 300">
              {/* Simple pixel art character */}
              <rect x="100" y="50" width="20" height="20" fill={selectedColor} stroke="#000" strokeWidth="1" />
              <rect x="120" y="50" width="20" height="20" fill={selectedColor} stroke="#000" strokeWidth="1" />
              <rect x="90" y="70" width="20" height="20" fill={selectedColor} stroke="#000" strokeWidth="1" />
              <rect x="100" y="70" width="20" height="20" fill={selectedColor} stroke="#000" strokeWidth="1" />
              <rect x="120" y="70" width="20" height="20" fill={selectedColor} stroke="#000" strokeWidth="1" />
              <rect x="130" y="70" width="20" height="20" fill={selectedColor} stroke="#000" strokeWidth="1" />
              <rect x="80" y="90" width="20" height="20" fill={selectedColor} stroke="#000" strokeWidth="1" />
              <rect x="100" y="90" width="20" height="20" fill={selectedColor} stroke="#000" strokeWidth="1" />
              <rect x="120" y="90" width="20" height="20" fill={selectedColor} stroke="#000" strokeWidth="1" />
              <rect x="140" y="90" width="20" height="20" fill={selectedColor} stroke="#000" strokeWidth="1" />
              <rect x="90" y="110" width="20" height="20" fill={selectedColor} stroke="#000" strokeWidth="1" />
              <rect x="110" y="110" width="20" height="20" fill={selectedColor} stroke="#000" strokeWidth="1" />
              <rect x="130" y="110" width="20" height="20" fill={selectedColor} stroke="#000" strokeWidth="1" />
            </svg>
          </div>

          {/* Color Picker */}
          <div className="mb-4">
            <p className="text-[#00eaff] font-bold mb-2">Pick a Color:</p>
            <div className="flex gap-2 flex-wrap">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded border-2 transition-all ${
                    selectedColor === color ? "border-white scale-110" : "border-gray-400"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <Button
              className="flex-1 btn-neon-cyan"
              onClick={() => {
                onComplete();
                onClose();
              }}
            >
              Done Coloring
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Off-Grid Adventure Game Component
function OffGridGame({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);

  const handleCollectResource = () => {
    setScore(score + 10);
    toast.success("Resource collected! +10 points");
  };

  const handleNextLevel = () => {
    if (level < 3) {
      setLevel(level + 1);
    } else {
      onComplete();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="bg-[#1a1f2e] border border-[#ff00cc] w-full max-w-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-[#ff00cc] mb-2">Off-Grid Adventure</h2>
          <p className="text-[#7a7f8e] mb-4">Level {level} / 3</p>

          {/* Game Area */}
          <div className="bg-[#0b0e14] rounded-lg p-6 mb-4 text-center">
            <div className="text-6xl mb-4">🌲</div>
            <p className="text-[#00eaff] font-bold mb-4">Collect resources to survive!</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={handleCollectResource}
                className="p-4 bg-[#1a1f2e] border border-[#2a2f3e] rounded hover:border-[#ff00cc] transition-colors text-2xl"
              >
                🌿
              </button>
              <button
                onClick={handleCollectResource}
                className="p-4 bg-[#1a1f2e] border border-[#2a2f3e] rounded hover:border-[#ff00cc] transition-colors text-2xl"
              >
                💧
              </button>
              <button
                onClick={handleCollectResource}
                className="p-4 bg-[#1a1f2e] border border-[#2a2f3e] rounded hover:border-[#ff00cc] transition-colors text-2xl"
              >
                🍄
              </button>
            </div>
            <p className="text-[#ff00cc] font-bold text-xl">Score: {score}</p>
          </div>

          {/* Buttons */}
          <Button className="w-full btn-neon-cyan" onClick={handleNextLevel}>
            {level < 3 ? `Next Level (${level + 1}/3)` : "Complete Adventure!"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function KidsCorner() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activeActivity, setActiveActivity] = useState<string | null>(null);
  const [completedItems, setCompletedItems] = useState<string[]>([]);

  // Fetch kids content
  const { data: content = [], isLoading: contentLoading } = trpc.kidsCorner.getContent.useQuery();

  // Track progress mutation
  const trackProgressMutation = trpc.kidsCorner.trackProgress.useMutation({
    onSuccess: () => {
      toast.success("Progress saved! Great job! 🎉");
    },
    onError: (error) => {
      toast.error(`Failed to save progress: ${error.message}`);
    },
  });

  const handleActivityComplete = (contentId: string, contentType: string) => {
    if (!completedItems.includes(contentId)) {
      setCompletedItems([...completedItems, contentId]);
    }
    trackProgressMutation.mutate({
      contentId,
      contentType,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">
        <div className="text-[#00eaff] text-xl">Loading Anom's Corner...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#00eaff] text-xl mb-4">Please sign in to access Anom's Corner</p>
          <Button className="btn-neon-magenta" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Verified Pixel & Dot native video files hosted in Anoms-Hub/anom-artsy.
  const videos = [
    {
      id: "pixel-dot-full",
      title: "Pixel & Dot's Full Story | Anom's Corner",
      description: "The complete Pixel & Dot story. Join these two characters on their epic journey through a neon-powered universe.",
      url: `${PIXEL_DOT_RAW_ASSET_BASE}/v8_pixel_dot_full_story_final.mp4`,
      duration: null,
      ageRating: 4,
    },
    {
      id: "pixel-dot-1",
      title: "v8 Scene 1: Stretched",
      description: "Pixel and Dot begin their v8 adventure.",
      url: `${PIXEL_DOT_RAW_ASSET_BASE}/v8_scene_1_stretched.mp4`,
      duration: null,
      ageRating: 4,
    },
    {
      id: "pixel-dot-scene-1",
      title: "v8 Scene 2: Stretched",
      description: "The second chapter of the v8 Pixel & Dot story.",
      url: `${PIXEL_DOT_RAW_ASSET_BASE}/v8_scene_2_stretched.mp4`,
      duration: null,
      ageRating: 4,
    },
    {
      id: "pixel-dot-scene-2",
      title: "v8 Scene 3: Stretched",
      description: "The third chapter of the v8 Pixel & Dot story.",
      url: `${PIXEL_DOT_RAW_ASSET_BASE}/v8_scene_3_stretched.mp4`,
      duration: null,
      ageRating: 4,
    },
    {
      id: "pixel-dot-scene-3",
      title: "v8 Scene 4: Stretched",
      description: "The fourth chapter of the v8 Pixel & Dot story.",
      url: `${PIXEL_DOT_RAW_ASSET_BASE}/v8_scene_4_stretched.mp4`,
      duration: null,
      ageRating: 4,
    },
    {
      id: "pixel-dot-scene-5",
      title: "v8 Scene 5: Stretched",
      description: "The fifth chapter of the v8 Pixel & Dot story.",
      url: `${PIXEL_DOT_RAW_ASSET_BASE}/v8_scene_5_stretched.mp4`,
      duration: null,
      ageRating: 4,
    },
  ];

  const activities = [
    {
      id: "coloring-1",
      type: "coloring",
      title: "Pixel's Coloring Page",
      description: "Color Pixel in the digital landscape.",
      ageRating: 3,
    },
    {
      id: "offgrid-1",
      type: "game",
      title: "Off-Grid Adventure: Kids Edition",
      description: "A fun educational game for kids.",
      ageRating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#00eaff]">
      {/* Navigation */}
      <nav className="border-b border-[#2a2f3e] px-6 py-4 sticky top-0 bg-[#0b0e14]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")} className="text-[#7a7f8e]">
              ← Back
            </Button>
            <h1 className="text-2xl font-bold neon-text-magenta">Anom's Corner</h1>
          </div>
          <div className="text-sm text-[#7a7f8e]">
            {completedItems.length} / {videos.length + activities.length} completed
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="bg-[#1a1f2e] border border-[#2a2f3e] mb-8">
            <TabsTrigger value="videos" className="text-[#00eaff]">
              <Play className="w-4 h-4 mr-2" />
              Pixel & Dot Videos
            </TabsTrigger>
            <TabsTrigger value="activities" className="text-[#00eaff]">
              <Palette className="w-4 h-4 mr-2" />
              Activities & Games
            </TabsTrigger>
          </TabsList>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            {contentLoading ? (
              <p className="text-[#7a7f8e]">Loading videos...</p>
            ) : videos.length === 0 ? (
              <p className="text-[#7a7f8e]">No videos available yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => {
                  const isCompleted = completedItems.includes(video.id);
                  return (
                    <Card
                      key={video.id}
                      className="bg-[#1a1f2e] border border-[#2a2f3e] p-6 hover:border-[#ff00cc] transition-colors"
                      style={{
                        boxShadow: "0 0 10px rgba(255, 0, 204, 0.5), 0 0 20px rgba(255, 0, 204, 0.3)",
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-[#00eaff]">{video.title}</h3>
                          <p className="text-xs text-[#7a7f8e] mt-1">Ages {video.ageRating}+</p>
                        </div>
                        {isCompleted && <CheckCircle2 className="w-5 h-5 text-[#00eaff]" />}
                      </div>

                      <p className="text-sm text-[#7a7f8e] mb-4">{video.description}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#7a7f8e]">
                          {video.duration ? `${video.duration} min` : "Native video"}
                        </span>
                        <Button
                          className="btn-neon-cyan gap-2 text-sm"
                          onClick={() => setActiveVideo(video.id)}
                        >
                          <Play className="w-3 h-3" />
                          {isCompleted ? "Watched" : "Watch"}
                        </Button>
                      </div>

                      {activeVideo === video.id && (
                        <VideoPlayer
                          videoUrl={video.url}
                          title={video.title}
                          onClose={() => {
                            setActiveVideo(null);
                            handleActivityComplete(video.id, "video");
                          }}
                        />
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {activities.map((activity) => {
                const isCompleted = completedItems.includes(activity.id);
                const icon =
                  activity.type === "coloring" ? (
                    <Palette className="w-6 h-6" />
                  ) : (
                    <Gamepad2 className="w-6 h-6" />
                  );

                return (
                  <Card
                    key={activity.id}
                    className="bg-[#1a1f2e] border border-[#2a2f3e] p-6 hover:border-[#00eaff] transition-colors"
                    style={{
                      boxShadow: "0 0 10px rgba(0, 234, 255, 0.5), 0 0 20px rgba(0, 234, 255, 0.3)",
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-[#ff00cc]">{icon}</div>
                        <div>
                          <h3 className="text-lg font-bold text-[#00eaff]">{activity.title}</h3>
                          <p className="text-xs text-[#7a7f8e] mt-1">Ages {activity.ageRating}+</p>
                        </div>
                      </div>
                      {isCompleted && <CheckCircle2 className="w-5 h-5 text-[#00eaff]" />}
                    </div>

                    <p className="text-sm text-[#7a7f8e] mb-6">{activity.description}</p>

                    <Button
                      className="w-full btn-neon-magenta gap-2"
                      onClick={() => setActiveActivity(activity.id)}
                    >
                      {activity.type === "coloring" ? (
                        <>
                          <Palette className="w-4 h-4" />
                          {isCompleted ? "Colored" : "Start Coloring"}
                        </>
                      ) : (
                        <>
                          <Gamepad2 className="w-4 h-4" />
                          {isCompleted ? "Played" : "Play Game"}
                        </>
                      )}
                    </Button>

                    {activeActivity === activity.id && activity.type === "coloring" && (
                      <ColoringPage
                        onClose={() => setActiveActivity(null)}
                        onComplete={() => handleActivityComplete(activity.id, "coloring")}
                      />
                    )}

                    {activeActivity === activity.id && activity.type === "game" && (
                      <OffGridGame
                        onClose={() => setActiveActivity(null)}
                        onComplete={() => handleActivityComplete(activity.id, "game")}
                      />
                    )}
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Progress Summary */}
        {!contentLoading && (
          <div className="mt-12 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg p-6">
            <h3 className="text-xl font-bold text-[#ff00cc] mb-4">Your Progress</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#00eaff]">{completedItems.length}</p>
                <p className="text-[#7a7f8e] text-sm">Items Completed</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#ff00cc]">
                  {Math.round((completedItems.length / (videos.length + activities.length)) * 100)}%
                </p>
                <p className="text-[#7a7f8e] text-sm">Completion Rate</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#9d4edd]">
                  {videos.length + activities.length - completedItems.length}
                </p>
                <p className="text-[#7a7f8e] text-sm">Items Remaining</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
