import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useMediaTracking } from '@/hooks/useMediaTracking';

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
  className?: string;
  contentId?: string;
  artistName?: string;
  playlistId?: string;
  viewerName?: string;
}

export const AudioPlayer = ({ audioUrl, title, className = '', contentId, artistName, playlistId, viewerName }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const { trackPlay, trackPause, trackEnded, trackSeek } = useMediaTracking();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    
    const handleEnded = () => {
      console.log('[AudioPlayer] Audio ended event triggered');
      setIsPlaying(false);
      
      if (contentId && title && artistName) {
        trackEnded({
          contentId,
          title,
          artistName,
          contentType: 'audio',
          duration: audio.duration || 0,
          playlistId,
          playerType: 'standalone' as any,
          viewerName,
        });
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [contentId, title, artistName, playlistId, trackEnded]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      console.log('[AudioPlayer] Audio pause triggered');
      audio.pause();
      
      if (contentId && title && artistName) {
        trackPause({
          contentId,
          title,
          artistName,
          contentType: 'audio',
          duration: audio.duration || 0,
          currentTime: audio.currentTime || 0,
          playlistId,
          playerType: 'standalone' as any,
          viewerName,
        });
      }
    } else {
      console.log('[AudioPlayer] Audio play triggered');
      audio.play();
      
      if (contentId && title && artistName) {
        trackPlay({
          contentId,
          title,
          artistName,
          contentType: 'audio',
          duration: audio.duration || 0,
          playlistId,
          playerType: 'standalone' as any,
          viewerName,
        });
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const oldTime = audio.currentTime;
    const newTime = value[0];
    
    console.log('[AudioPlayer] Audio seek:', oldTime, '→', newTime);
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    
    if (contentId && title && artistName) {
      trackSeek({
        contentId,
        title,
        artistName,
        contentType: 'audio',
        duration: audio.duration || 0,
        fromTime: oldTime,
        toTime: newTime,
        playlistId,
        playerType: 'standalone' as any,
        viewerName,
      });
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isMuted) {
      audio.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-col gap-3 p-4 bg-card rounded-lg border ${className}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {title && (
        <div className="text-sm font-medium truncate">{title}</div>
      )}

      <div className="flex items-center gap-3">
        <Button
          size="icon"
          variant="ghost"
          onClick={togglePlay}
          className="h-10 w-10 shrink-0"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>

        <div className="flex-1 flex flex-col gap-1">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleMute}
            className="h-8 w-8"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-20 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
