export const validateVideoDuration = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration <= 5);
    };
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(false);
    };
    video.src = URL.createObjectURL(file);
  });
};

export const validateVideoSize = (file: File): boolean => {
  const maxSizeInBytes = 100 * 1024 * 1024; // 100MB
  return file.size <= maxSizeInBytes;
};

export const isVideoFile = (file: File): boolean => {
  return file.type.startsWith('video/') && 
         (file.type.includes('mp4') || file.type.includes('webm'));
};

export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/') && 
         (file.type.includes('jpeg') || file.type.includes('jpg') || 
          file.type.includes('png') || file.type.includes('webp'));
};

export const validateImageSize = (file: File): boolean => {
  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
  return file.size <= maxSizeInBytes;
};
