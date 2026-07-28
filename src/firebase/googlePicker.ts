import { signInWithGoogle, getCachedGoogleAccessToken } from './authService';

export interface PickedDriveFile {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  mimeType?: string;
}

let isGapiLoading = false;

export function loadGooglePickerLibrary(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.picker) {
      resolve();
      return;
    }

    if (isGapiLoading) {
      const checkInterval = setInterval(() => {
        if ((window as any).google?.picker) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }

    isGapiLoading = true;

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).gapi) {
        (window as any).gapi.load('picker', {
          callback: () => {
            isGapiLoading = false;
            resolve();
          },
          onerror: () => {
            isGapiLoading = false;
            reject(new Error('Failed to load Google Picker library module.'));
          },
        });
      } else {
        isGapiLoading = false;
        reject(new Error('gapi object not found.'));
      }
    };
    script.onerror = () => {
      isGapiLoading = false;
      reject(new Error('Failed to load Google API script.'));
    };
    document.body.appendChild(script);
  });
}

export async function openGooglePicker(
  onFilePicked: (file: PickedDriveFile) => void,
  onError?: (error: string) => void
): Promise<void> {
  try {
    await loadGooglePickerLibrary();

    let token = getCachedGoogleAccessToken();
    if (!token) {
      const authResult = await signInWithGoogle();
      token = authResult.accessToken;
    }

    if (!token) {
      throw new Error('Google authentication required to access Google Drive.');
    }

    const pickerOrigin =
      window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
        ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
        : window.location.origin;

    const google = (window as any).google;

    const docsView = new google.picker.DocsView(google.picker.ViewId.DOCS)
      .setMimeTypes('image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml')
      .setMode(google.picker.DocsViewMode.GRID);

    const uploadView = new google.picker.DocsUploadView();

    const picker = new google.picker.PickerBuilder()
      .addView(docsView)
      .addView(uploadView)
      .setOAuthToken(token)
      .setCallback((data: any) => {
        if (data.action === google.picker.Action.PICKED) {
          const doc = data.docs?.[0];
          if (doc) {
            const fileId = doc.id;
            const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
            const thumbUrl = doc.thumbnails?.[0]?.url || `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;

            onFilePicked({
              id: fileId,
              name: doc.name || 'Drive Image',
              url: directUrl,
              thumbnailUrl: thumbUrl,
              mimeType: doc.mimeType,
            });
          }
        }
      })
      .setOrigin(pickerOrigin)
      .setTitle('Select an Image from Google Drive')
      .build();

    picker.setVisible(true);
  } catch (err: any) {
    console.error('Google Picker error:', err);
    if (onError) {
      onError(err.message || 'Failed to open Google Picker');
    }
  }
}
