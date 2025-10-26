import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { Progress } from './ui/progress';
import { VideoFeedControls } from './VideoFeedControls';
import { useMediaTracking } from '@/hooks/useMediaTracking';

interface VideoFeedItemProps {
  content: {
    id: string;
    title: string;
    kind: string;
    video_url?: string;
    audio_url?: string;
    thumb_url?: string;
    duration?: number;
    artist_id: string;
    content_type: 'video' | 'audio';
    artists?: {
      display_name: string;
      slug: string;
    };
  };
  isActive: boolean;
  onVideoRef?: (ref: HTMLVideoElement | null) => void;
}

export const VideoFeedItem = ({ content, isActive, onVideoRef }: VideoFeedItemProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { trackPlay, trackPause, trackEnded } = useMediaTracking();

  const isAudio = content.content_type === 'audio';

  useEffect(() => {
    if (videoRef.current && onVideoRef) {
      onVideoRef(videoRef.current);
    }
  }, [onVideoRef]);

  useEffect(() => {
    const mediaElement = isAudio ? audioRef.current : videoRef.current;
    if (!mediaElement) return;

    if (isActive) {
      mediaElement.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    } else {
      mediaElement.pause();
      setIsPlaying(false);
    }
  }, [isActive, isAudio]);

  useEffect(() => {
    const mediaElement = isAudio ? audioRef.current : videoRef.current;
    if (!mediaElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(mediaElement.currentTime);
      setProgress((mediaElement.currentTime / mediaElement.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(mediaElement.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      
      // Track ended event
      trackEnded({
        contentId: content.id,
        title: content.title,
        artistName: content.artists?.display_name || 'Unknown',
        contentType: content.content_type,
        duration: duration,
        playerType: 'feed',
      });
    };

    mediaElement.addEventListener('timeupdate', handleTimeUpdate);
    mediaElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    mediaElement.addEventListener('ended', handleEnded);

    return () => {
      mediaElement.removeEventListener('timeupdate', handleTimeUpdate);
      mediaElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      mediaElement.removeEventListener('ended', handleEnded);
    };
  }, [isAudio, trackEnded, content.id, content.title, content.artists, content.content_type, duration]);

  const togglePlayPause = () => {
    const mediaElement = isAudio ? audioRef.current : videoRef.current;
    if (!mediaElement) return;

    if (isPlaying) {
      mediaElement.pause();
      setIsPlaying(false);
      
      // Track pause event
      trackPause({
        contentId: content.id,
        title: content.title,
        artistName: content.artists?.display_name || 'Unknown',
        contentType: content.content_type,
        duration: duration,
        currentTime: currentTime,
        playerType: 'feed',
      });
    } else {
      mediaElement.play();
      setIsPlaying(true);
      
      // Track play event
      trackPlay({
        contentId: content.id,
        title: content.title,
        artistName: content.artists?.display_name || 'Unknown',
        contentType: content.content_type,
        duration: duration,
        playerType: 'feed',
      });
    }
  };

  const toggleMute = () => {
    const mediaElement = isAudio ? audioRef.current : videoRef.current;
    if (!mediaElement) return;
    mediaElement.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full h-full bg-black snap-start snap-always">
      {isAudio ? (
        <>
          {/* Audio with Thumbnail Background */}
          <div 
            className="w-full h-full bg-cover bg-center flex items-center justify-center relative"
            style={{
              backgroundImage: content.thumb_url ? `url(${content.thumb_url})` : 'none',
              backgroundColor: content.thumb_url ? 'transparent' : '#000'
            }}
          >
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black/40" />
            
            {/* Audio element */}
            <audio
              ref={audioRef}
              src={content.audio_url}
              loop
              muted={isMuted}
            />
          </div>
        </>
      ) : (
        <video
          ref={videoRef}
          src={content.video_url}
          poster={content.thumb_url}
          className="w-full h-full object-contain"
          loop
          playsInline
          muted={isMuted}
          onClick={togglePlayPause}
        />
      )}

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
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
          {content.kind || (isAudio ? 'Audio Track' : 'Video')}
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
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-10">
        <div className="space-y-2">
          <Progress value={progress} className="h-1" />
          <div className="flex justify-between items-end">
            <div className="text-white space-y-1 flex-1">
              <h3 className="font-semibold text-lg line-clamp-1">{content.title}</h3>
              {content.artists && (
                <p className="text-sm text-white/80">@{content.artists.display_name}</p>
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
        videoId={content.id} 
        artistId={content.artist_id}
        artistSlug={content.artists?.slug}
      />
    </div>
  );
};
