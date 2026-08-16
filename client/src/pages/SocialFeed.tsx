import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, Share2, Zap, Play, Volume2, VolumeX, Maximize, ArrowLeft, Loader2, ThumbsUp } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface FeedPost {
  id: string;
  author: string;
  avatar: string;
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  liked: boolean;
}

interface Reel {
  id: string;
  title: string;
  creator: string;
  description: string;
  thumbnail: string;
  duration: string;
  views: number;
  videoUrl: string;
  likes: number;
  liked: boolean;
}

export default function SocialFeed() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [posts, setPosts] = useState<FeedPost[]>([
    {
      id: "1",
      author: "Pixel the Explorer",
      avatar: "🤖",
      content: "Just discovered a new corner of the Anom Universe! The neon glow is absolutely stunning. #AnonArtsy #Exploration",
      timestamp: "2 hours ago",
      likes: 245,
      comments: 18,
      liked: false,
    },
    {
      id: "2",
      author: "Dot's Adventures",
      avatar: "✨",
      content: "My family lounge just hit 100 members! Thanks everyone for making this such a fun space to connect. #FamilyFirst #LoungeLove",
      image: "🎉",
      timestamp: "4 hours ago",
      likes: 512,
      comments: 42,
      liked: false,
    },
    {
      id: "3",
      author: "Cosmic Meme Master",
      avatar: "🌌",
      content: "When you finally unlock that rare achievement... 😎 #AnonArtsy #LevelUp",
      image: "🏆",
      timestamp: "6 hours ago",
      likes: 1203,
      comments: 89,
      liked: false,
    },
    {
      id: "4",
      author: "Neon Enthusiast",
      avatar: "💜",
      content: "The new purple theme is fire! 🔥 Switched all my lounges to this vibe. Who else is team purple? #NeonLife",
      timestamp: "8 hours ago",
      likes: 678,
      comments: 56,
      liked: false,
    },
    {
      id: "5",
      author: "Kids Corner Creator",
      avatar: "🎨",
      content: "My kids just finished all the Pixel & Dot episodes! They're so excited about the coloring pages. Educational + fun! #KidsCorner #ParentWin",
      timestamp: "10 hours ago",
      likes: 423,
      comments: 31,
      liked: false,
    },
  ]);

  const [reels, setReels] = useState<Reel[]>([
    {
      id: "reel-1",
      title: "Pixel & Dot's Full Story | Anom Studios",
      creator: "Anom Studios",
      description: "The complete Pixel & Dot story. Join these two characters on their epic journey through a neon-powered universe.",
      thumbnail: "🎬",
      duration: "Full Story",
      views: 12543,
      videoUrl: "https://raw.githubusercontent.com/Anoms-Hub/anom-artsy/main/assets/v8_pixel_dot_full_story_final.mp4",
      likes: 1420,
      liked: false,
    },
    {
      id: "reel-2",
      title: "Pixel & Dot: Scene 1",
      creator: "Anom Studios",
      description: "Explore the first major scene and discovery in the Anom Universe series.",
      thumbnail: "✨",
      duration: "Scene 1",
      views: 8234,
      videoUrl: "https://raw.githubusercontent.com/Anoms-Hub/anom-artsy/main/assets/v8_scene_1_stretched.mp4",
      likes: 890,
      liked: false,
    },
    {
      id: "reel-3",
      title: "Pixel & Dot: Scene 2",
      creator: "Anom Studios",
      description: "Deep dive into neon mechanics and cooperative challenges.",
      thumbnail: "⚡",
      duration: "Scene 2",
      views: 5678,
      videoUrl: "https://raw.githubusercontent.com/Anoms-Hub/anom-artsy/main/assets/v8_scene_2_stretched.mp4",
      likes: 640,
      liked: false,
    },
    {
      id: "reel-4",
      title: "Pixel & Dot: Scene 3",
      creator: "Anom Studios",
      description: "A heartwarming journey across futuristic digital landscapes.",
      thumbnail: "💜",
      duration: "Scene 3",
      views: 15234,
      videoUrl: "https://raw.githubusercontent.com/Anoms-Hub/anom-artsy/main/assets/v8_scene_3_stretched.mp4",
      likes: 1850,
      liked: false,
    },
  ]);

  const [activeReel, setActiveReel] = useState<Reel>(reels[0]);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleLikePost = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const handleLikeReel = (reelId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setReels(
      reels.map((reel) => {
        if (reel.id === reelId) {
          const nextLiked = !reel.liked;
          const updated = {
            ...reel,
            liked: nextLiked,
            likes: nextLiked ? reel.likes + 1 : reel.likes - 1,
          };
          if (activeReel.id === reelId) {
            setActiveReel(updated);
          }
          toast.success(nextLiked ? "Liked reel! ❤️" : "Unliked reel");
          return updated;
        }
        return reel;
      })
    );
  };

  const handleShareReel = (reel: Reel, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(reel.videoUrl);
    toast.success(`Copied direct video link for '${reel.title}'!`);
  };

  const handleComment = (postId: string) => {
    toast.info("Comments feature coming soon!");
  };

  const handleShare = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const shareUrl = `${window.location.origin}/feed/post/${postId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied! Share on social media or paste anywhere.');
  };

  const handlePlayReel = (reel: Reel) => {
    setIsBuffering(true);
    setActiveReel(reel);
    toast.success(`Now playing: ${reel.title}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        (videoRef.current as any).webkitRequestFullscreen();
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">
        <div className="text-[#00eaff] text-xl flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#ff00cc]" />
          Loading Feed...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#00eaff] text-xl mb-4">Please sign in to view the social feed</p>
          <Button className="btn-neon-magenta" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#00eaff]">
      {/* Navigation */}
      <nav className="border-b border-[#2a2f3e] px-6 py-4 sticky top-0 bg-[#0b0e14]/95 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")} className="text-[#7a7f8e] flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold neon-text-cyan">Live from the Universe</h1>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Active Reel Video Player Section */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-[#ff00cc] mb-4 flex items-center gap-2">
            <Play className="w-6 h-6" />
            Featured Reels Player: {activeReel.title}
          </h2>
          <Card className="bg-[#1a1f2e] border-2 border-[#ff00cc]/60 overflow-hidden p-4 shadow-[0_0_20px_rgba(255,0,204,0.3)]">
            <div className="relative w-full bg-black rounded-lg overflow-hidden border border-[#2a2f3e] aspect-video flex items-center justify-center">
              {isBuffering && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 gap-3">
                  <Loader2 className="w-12 h-12 animate-spin text-[#00eaff]" />
                  <span className="text-sm text-[#00eaff] font-bold tracking-wide animate-pulse">Buffering Reel Stream...</span>
                </div>
              )}
              <video
                ref={videoRef}
                key={activeReel.videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => setIsBuffering(false)}
                onCanPlay={() => setIsBuffering(false)}
              >
                <source src={activeReel.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Floating Custom Video Overlays */}
              <div className="absolute top-3 right-3 flex items-center gap-2 z-25 bg-black/70 p-1.5 rounded-lg border border-[#00eaff]/30 backdrop-blur">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-black/40 hover:bg-black/80 text-white h-7 px-2"
                  onClick={toggleMute}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#00eaff]" />}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  defaultValue="1"
                  className="w-20 accent-[#00eaff] cursor-pointer"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (videoRef.current) {
                      videoRef.current.volume = val;
                      setIsMuted(val === 0);
                    }
                  }}
                  title="Volume Slider"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-black/40 hover:bg-black/80 text-white h-7 px-2"
                  onClick={toggleFullscreen}
                  title="Fullscreen"
                >
                  <Maximize className="w-4 h-4 text-[#00eaff]" />
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-[#00eaff]">{activeReel.title}</h3>
                <p className="text-sm text-gray-300 mt-1">{activeReel.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">👁️ {activeReel.views.toLocaleString()} views</span>
                <Button
                  size="sm"
                  variant="outline"
                  className={`border-[#ff00cc] ${activeReel.liked ? 'bg-[#ff00cc] text-black font-bold' : 'text-[#ff00cc] bg-black/40 hover:bg-[#ff00cc]/20'}`}
                  onClick={(e) => handleLikeReel(activeReel.id, e)}
                >
                  <Heart className={`w-4 h-4 mr-1 ${activeReel.liked ? 'fill-black' : ''}`} />
                  {activeReel.likes}
                </Button>
                <Button
                  size="sm"
                  className="bg-[#ff00cc] hover:bg-[#ff00cc]/80 text-black font-bold"
                  onClick={(e) => handleShareReel(activeReel, e)}
                >
                  <Share2 className="w-3 h-3 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Reels Gallery Grid */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-[#00eaff] mb-6">Select a Reel to Play</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {reels.map((reel) => {
              const isSelected = activeReel.id === reel.id;
              return (
                <Card
                  key={reel.id}
                  className={`bg-[#1a1f2e] border overflow-hidden transition-all cursor-pointer group ${isSelected ? 'border-[#ff00cc] shadow-[0_0_15px_rgba(255,0,204,0.5)]' : 'border-[#2a2f3e] hover:border-[#00eaff]'}`}
                  onClick={() => handlePlayReel(reel)}
                >
                  <div className="relative bg-gradient-to-br from-[#1a1f2e] to-[#0b0e14] aspect-video flex items-center justify-center overflow-hidden">
                    <div className="text-8xl group-hover:scale-110 transition-transform">{reel.thumbnail}</div>
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                      <Play className="w-16 h-16 text-[#ff00cc] group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-[#00eaff] font-bold">
                      {reel.duration}
                    </div>

                    {/* Overlay Like & Share Buttons */}
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="secondary"
                        className={`h-8 w-8 rounded-full bg-black/70 hover:bg-black ${reel.liked ? 'text-[#ff00cc]' : 'text-white'}`}
                        onClick={(e) => handleLikeReel(reel.id, e)}
                        title="Like Reel"
                      >
                        <Heart className={`w-4 h-4 ${reel.liked ? 'fill-[#ff00cc]' : ''}`} />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-full bg-black/70 hover:bg-black text-white"
                        onClick={(e) => handleShareReel(reel, e)}
                        title="Share Reel"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-4">
                    <h4 className="font-bold text-[#ff00cc] mb-1 line-clamp-2">{reel.title}</h4>
                    <p className="text-sm text-[#7a7f8e] mb-2">{reel.creator}</p>
                    <p className="text-sm text-[#00eaff] line-clamp-2 mb-3">{reel.description}</p>
                    <div className="flex items-center justify-between text-xs text-[#7a7f8e]">
                      <span>👁️ {reel.views.toLocaleString()} views · ❤️ {reel.likes}</span>
                      <Button
                        size="sm"
                        className={`${isSelected ? 'bg-[#00eaff] text-black' : 'bg-[#ff00cc] text-black'} font-bold hover:opacity-90`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayReel(reel);
                        }}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        {isSelected ? 'Playing Now' : 'Play'}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#2a2f3e] my-12"></div>

        {/* Create Post Section */}
        <Card
          className="bg-[#1a1f2e] border border-[#2a2f3e] p-6 mb-8"
          style={{
            boxShadow: "0 0 10px rgba(0, 234, 255, 0.5), 0 0 20px rgba(0, 234, 255, 0.3)",
          }}
        >
          <div className="flex gap-4">
            <div className="text-2xl">🌟</div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="What's happening in your Anom Universe?"
                className="w-full bg-[#0b0e14] border border-[#2a2f3e] rounded px-4 py-3 text-[#00eaff] placeholder-[#7a7f8e] focus:outline-none focus:border-[#ff00cc]"
                onClick={() => toast.info("Post creation coming soon!")}
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" className="text-[#7a7f8e] border-[#2a2f3e]">
                  Add Image
                </Button>
                <Button className="btn-neon-cyan">Post</Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Feed Posts */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-[#00eaff] mb-6">Community Posts</h2>
          {posts.map((post) => (
            <Card
              key={post.id}
              className="bg-[#1a1f2e] border border-[#2a2f3e] p-6 hover:border-[#ff00cc] transition-colors"
              style={{
                boxShadow: "0 0 10px rgba(255, 0, 204, 0.3), 0 0 20px rgba(255, 0, 204, 0.1)",
              }}
            >
              {/* Post Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">{post.avatar}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#00eaff]">{post.author}</h3>
                  <p className="text-xs text-[#7a7f8e]">{post.timestamp}</p>
                </div>
              </div>

              {/* Post Content */}
              <p className="text-[#00eaff] mb-4 leading-relaxed">{post.content}</p>

              {/* Post Image */}
              {post.image && (
                <div className="mb-4 p-4 bg-[#0b0e14] rounded border border-[#2a2f3e] text-center text-3xl">
                  {post.image}
                </div>
              )}

              {/* Post Stats */}
              <div className="flex gap-6 text-sm text-[#7a7f8e] mb-4 pb-4 border-b border-[#2a2f3e]">
                <span>{post.likes} likes</span>
                <span>{post.comments} comments</span>
              </div>

              {/* Post Actions */}
              <div className="flex justify-around gap-2">
                <Button
                  variant="ghost"
                  className="flex-1 text-[#7a7f8e] hover:text-[#ff00cc] gap-2"
                  onClick={() => handleLikePost(post.id)}
                >
                  <Heart
                    className={`w-4 h-4 ${post.liked ? "fill-[#ff00cc] text-[#ff00cc]" : ""}`}
                  />
                  <span className="text-sm">{post.liked ? "Liked" : "Like"}</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 text-[#7a7f8e] hover:text-[#00eaff] gap-2"
                  onClick={() => handleComment(post.id)}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">Comment</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 text-[#7a7f8e] hover:text-[#9d4edd] gap-2"
                  onClick={() => handleShare(post.id)}
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm">Share</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button
            variant="outline"
            className="text-[#00eaff] border-[#2a2f3e] gap-2"
            onClick={() => toast.info("More posts loading...")}
          >
            <Zap className="w-4 h-4" />
            Load More Posts
          </Button>
        </div>
      </main>
    </div>
  );
}
