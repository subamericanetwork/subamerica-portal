/**
 * Extracts a thumbnail from a video file or URL
 * @param source - File object or video URL
 * @param timeInSeconds - Time position to capture (default: 1 second)
 * @returns Promise<Blob> - The thumbnail as a Blob
 */
export const extractThumbnailFromVideo = (
  source: File | string,
  timeInSeconds: number = 1
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    console.log('[Thumbnail] Starting extraction from:', source instanceof File ? 'File object' : source);
    
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      console.error('[Thumbnail] Failed to get canvas context');
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Don't set crossOrigin for Supabase storage URLs or blob URLs
    if (typeof source === 'string' && !source.includes('supabase') && !source.startsWith('blob:')) {
      video.crossOrigin = 'anonymous';
    }
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.addEventListener('loadedmetadata', () => {
      console.log('[Thumbnail] Video metadata loaded, duration:', video.duration);
      // Set video time to capture frame
      const seekTime = Math.min(timeInSeconds, video.duration - 0.1);
      console.log('[Thumbnail] Seeking to:', seekTime);
      video.currentTime = seekTime;
    });

    video.addEventListener('seeked', () => {
      try {
        console.log('[Thumbnail] Seeked successfully, video dimensions:', video.videoWidth, 'x', video.videoHeight);
        
        // Set canvas dimensions to video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        if (canvas.width === 0 || canvas.height === 0) {
          console.error('[Thumbnail] Invalid video dimensions');
          reject(new Error('Invalid video dimensions'));
          return;
        }

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        console.log('[Thumbnail] Frame drawn to canvas');

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log('[Thumbnail] Thumbnail created successfully, size:', blob.size);
              resolve(blob);
            } else {
              console.error('[Thumbnail] Failed to create blob');
              reject(new Error('Could not create thumbnail blob'));
            }
            
            // Cleanup
            if (source instanceof File) {
              URL.revokeObjectURL(video.src);
            }
            video.remove();
            canvas.remove();
          },
          'image/jpeg',
          0.9
        );
      } catch (error) {
        console.error('[Thumbnail] Error during seeked event:', error);
        reject(error);
      }
    });

    video.addEventListener('error', (e) => {
      const errorMsg = video.error 
        ? `Video error: code ${video.error.code} - ${['', 'MEDIA_ERR_ABORTED', 'MEDIA_ERR_NETWORK', 'MEDIA_ERR_DECODE', 'MEDIA_ERR_SRC_NOT_SUPPORTED'][video.error.code] || 'UNKNOWN'}`
        : 'Error loading video';
      console.error('[Thumbnail]', errorMsg, e);
      clearTimeout(timeout);
      if (source instanceof File) {
        URL.revokeObjectURL(video.src);
      }
      reject(new Error(errorMsg));
      video.remove();
      canvas.remove();
    });

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.error('[Thumbnail] Timeout after 30 seconds');
      if (source instanceof File) {
        URL.revokeObjectURL(video.src);
      }
      reject(new Error('Timeout loading video (30s)'));
      video.remove();
      canvas.remove();
    }, 30000);

    // Clear timeout on success
    video.addEventListener('seeked', () => {
      clearTimeout(timeout);
    }, { once: true });

    // Set video source
    if (source instanceof File) {
      console.log('[Thumbnail] Creating blob URL from file');
      video.src = URL.createObjectURL(source);
    } else {
      console.log('[Thumbnail] Loading from URL:', source);
      video.src = source;
    }
    
    // Trigger load
    video.load();
  });
};

/**
 * Extracts thumbnail and returns as data URL
 */
export const extractThumbnailAsDataURL = async (
  source: File | string,
  timeInSeconds: number = 1
): Promise<string> => {
  const blob = await extractThumbnailFromVideo(source, timeInSeconds);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
