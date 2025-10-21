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
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Only set crossOrigin for external URLs, not for same-origin Supabase URLs
    if (typeof source === 'string' && !source.includes(window.location.hostname)) {
      video.crossOrigin = 'anonymous';
    }
    video.preload = 'metadata';
    video.muted = true; // Mute to avoid autoplay restrictions

    video.addEventListener('loadedmetadata', () => {
      // Set video time to capture frame
      video.currentTime = Math.min(timeInSeconds, video.duration);
    });

    video.addEventListener('seeked', () => {
      try {
        // Set canvas dimensions to video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not create thumbnail blob'));
            }
            
            // Cleanup
            video.remove();
            canvas.remove();
          },
          'image/jpeg',
          0.9
        );
      } catch (error) {
        reject(error);
      }
    });

    video.addEventListener('error', (e) => {
      const errorMsg = video.error ? `Video error code: ${video.error.code}` : 'Error loading video';
      reject(new Error(errorMsg));
      video.remove();
      canvas.remove();
    });

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      reject(new Error('Timeout loading video'));
      video.remove();
      canvas.remove();
    }, 30000); // 30 second timeout

    // Clear timeout on success
    video.addEventListener('seeked', () => {
      clearTimeout(timeout);
    }, { once: true });

    // Set video source
    if (source instanceof File) {
      video.src = URL.createObjectURL(source);
    } else {
      video.src = source;
    }
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
