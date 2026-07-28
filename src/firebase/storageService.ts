import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

export interface UploadOptions {
  folder?: string;
  maxSizeMB?: number;
}

export async function uploadImage(
  file: File,
  restaurantId: string,
  options: UploadOptions = {}
): Promise<{ url: string; path: string }> {
  const { folder = 'menu', maxSizeMB = 5 } = options;

  // Validate size
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`File size exceeds maximum allowed limit of ${maxSizeMB}MB.`);
  }

  // Validate type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid image format. Supported types: JPG, PNG, WEBP, GIF, SVG.');
  }

  // Normalize folder name according to requirements
  let subFolder = 'menu';
  if (folder === 'logo') subFolder = 'logo';
  else if (folder === 'cover') subFolder = 'cover';
  else if (folder.includes('menu')) subFolder = 'menu';

  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `restaurants/${restaurantId}/${subFolder}/${Date.now()}_${cleanFileName}`;
  const storageRef = ref(storage, filePath);

  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      null,
      (error) => {
        console.error('Storage upload error:', error);
        reject(new Error(`Failed to upload image: ${error.message}`));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url: downloadUrl, path: filePath });
        } catch (e: any) {
          reject(new Error(`Failed to get image URL: ${e.message}`));
        }
      }
    );
  });
}

export async function deleteImageByPath(storagePath: string): Promise<void> {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (e) {
    console.warn('Failed to delete image from storage (might not exist):', e);
  }
}
