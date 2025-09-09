/**
 * Utility functions for handling images and media
 */

/**
 * Check if a URL is a video file based on file extension
 */
export const isVideo = (url: string): boolean => {
  if (!url) return false;
  
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.m4v'];
  const lowercaseUrl = url.toLowerCase();
  
  return videoExtensions.some(ext => lowercaseUrl.includes(ext));
};

/**
 * Check if a URL is an image file based on file extension
 */
export const isImage = (url: string): boolean => {
  if (!url) return false;
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
  const lowercaseUrl = url.toLowerCase();
  
  return imageExtensions.some(ext => lowercaseUrl.includes(ext));
};

/**
 * Convert IPFS URL to HTTP gateway URL
 */
export const convertIpfsToHttp = (url: string, gateway: string = 'https://ipfs.io/ipfs/'): string => {
  if (!url) return '';
  
  // Handle ipfs:// protocol
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', gateway);
  }
  
  // Handle /ipfs/ path
  if (url.startsWith('/ipfs/')) {
    return gateway + url.slice(6);
  }
  
  // Handle raw IPFS hash
  if (url.match(/^[Qm][1-9A-HJ-NP-Za-km-z]{44,}$/)) {
    return gateway + url;
  }
  
  // Return as-is if not IPFS
  return url;
};

/**
 * Get optimized image dimensions based on container size
 */
export const getOptimizedImageDimensions = (
  containerWidth: number, 
  containerHeight: number, 
  maxWidth: number = 800, 
  maxHeight: number = 600
) => {
  const aspectRatio = containerWidth / containerHeight;
  
  let width = Math.min(containerWidth, maxWidth);
  let height = Math.min(containerHeight, maxHeight);
  
  // Maintain aspect ratio
  if (width / height > aspectRatio) {
    width = height * aspectRatio;
  } else {
    height = width / aspectRatio;
  }
  
  return {
    width: Math.round(width),
    height: Math.round(height),
  };
};

/**
 * Generate blur data URL for image placeholders
 */
export const generateBlurDataUrl = (width: number = 10, height: number = 10): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  canvas.width = width;
  canvas.height = height;
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.1);
};

/**
 * Check if image URL is accessible
 */
export const checkImageAccessibility = async (url: string, timeout: number = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    const timeoutId = setTimeout(() => {
      resolve(false);
    }, timeout);
    
    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(true);
    };
    
    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve(false);
    };
    
    img.src = url;
  });
};
