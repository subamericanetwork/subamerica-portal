export const detectMediaType = (url: string): 'video' | 'audio' => {
  if (!url) return 'audio';
  
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
  
  const lowerUrl = url.toLowerCase();
  
  if (videoExtensions.some(ext => lowerUrl.includes(ext))) {
    return 'video';
  }
  if (audioExtensions.some(ext => lowerUrl.includes(ext))) {
    return 'audio';
  }
  
  // Default to video since most content is video
  return 'video';
};

export const enablePictureInPicture = async (videoElement: HTMLVideoElement) => {
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      await videoElement.requestPictureInPicture();
    }
  } catch (error) {
    console.error('PIP error:', error);
  }
};

export const toggleFullscreen = async (element: HTMLElement) => {
  try {
    if (!document.fullscreenElement) {
      await element.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (error) {
    console.error('Fullscreen error:', error);
  }
};
