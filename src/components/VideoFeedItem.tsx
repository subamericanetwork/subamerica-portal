import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { Progress } from './ui/progress';
import { VideoFeedControls } from './VideoFeedControls';

interface VideoFeedItemProps {
  video: {
    id: string;
    title: string;
    kind: string;
    video_url: string;
    thumb_url?: string;
    duration?: number;
    artist_id: string;
    artists?: {
      display_name: string;
      slug: string;
    };
  };
  isActive: boolean;
  onVideoRef?: (ref: HTMLVideoElement | null) => void;
}

export const VideoFeedItem = ({ video, isActive, onVideoRef }: VideoFeedItemProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (videoRef.current && onVideoRef) {
      onVideoRef(videoRef.current);
    }
  }, [onVideoRef]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isActive) {
      videoElement.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    } else {
      videoElement.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
      setProgress((videoElement.currentTime / videoElement.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('ended', handleEnded);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full h-full bg-black snap-start snap-always">
      <video
        ref={videoRef}
        src={video.video_url}
        poster={video.thumb_url}
        className="w-full h-full object-contain"
        loop
        playsInline
        muted={isMuted}
        onClick={togglePlayPause}
      />

      {/* Center Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors"
      >
        {!isPlaying && (
          <div className="bg-background/80 backdrop-blur-sm rounded-full p-6">
            <Play className="h-12 w-12 text-foreground" />
          </div>
        )}
      </button>

      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <div className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
          {video.kind || 'Video'}
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleMute}
          className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Bottom Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="space-y-2">
          <Progress value={progress} className="h-1" />
          <div className="flex justify-between items-end">
            <div className="text-white space-y-1 flex-1">
              <h3 className="font-semibold text-lg line-clamp-1">{video.title}</h3>
              {video.artists && (
                <p className="text-sm text-white/80">@{video.artists.display_name}</p>
              )}
            </div>
            <div className="text-white/80 text-xs ml-4">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side Controls */}
      <VideoFeedControls 
        videoId={video.id} 
        artistId={video.artist_id}
        artistSlug={video.artists?.slug}
      />
    </div>
  );
};
