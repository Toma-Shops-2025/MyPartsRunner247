/**
 * Shared Google Maps API Loader
 * Prevents multiple script loads and provides a centralized loading mechanism
 */

interface GoogleMapsLoaderState {
  isLoading: boolean;
  isLoaded: boolean;
  loadPromise: Promise<void> | null;
}

let loaderState: GoogleMapsLoaderState = {
  isLoading: false,
  isLoaded: false,
  loadPromise: null
};

/**
 * Loads the Google Maps JavaScript API if not already loaded
 * @param libraries - Optional array of libraries to load (e.g., ['places', 'geometry'])
 * @returns Promise that resolves when the API is loaded
 */
export function loadGoogleMaps(libraries: string[] = []): Promise<void> {
  // If already loaded, return resolved promise
  if (loaderState.isLoaded && window.google?.maps) {
    return Promise.resolve();
  }

  // If currently loading, return the existing promise
  if (loaderState.isLoading && loaderState.loadPromise) {
    return loaderState.loadPromise;
  }

  // Check if script tag already exists
  const existingScript = document.querySelector(
    'script[src*="maps.googleapis.com/maps/api/js"]'
  );

  if (existingScript) {
    // Script exists but might not be loaded yet
    if (window.google?.maps) {
      loaderState.isLoaded = true;
      loaderState.isLoading = false;
      return Promise.resolve();
    }

    // Wait for existing script to load
    loaderState.isLoading = true;
    loaderState.loadPromise = new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkInterval);
          loaderState.isLoaded = true;
          loaderState.isLoading = false;
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!window.google?.maps) {
          clearInterval(checkInterval);
          loaderState.isLoading = false;
          loaderState.loadPromise = null;
          reject(new Error('Google Maps API failed to load'));
        }
      }, 10000);
    });

    return loaderState.loadPromise;
  }

  // Start loading
  loaderState.isLoading = true;
  loaderState.loadPromise = new Promise((resolve, reject) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 
                   'AIzaSyBNIjxagh6NVm-NQz0lyUMlGAQJEkReJ7o'; // Fallback for development
    
    if (!apiKey) {
      const error = new Error('Google Maps API key not configured');
      loaderState.isLoading = false;
      loaderState.loadPromise = null;
      reject(error);
      return;
    }

    const librariesParam = libraries.length > 0 ? `&libraries=${libraries.join(',')}` : '';
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${librariesParam}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google?.maps) {
        loaderState.isLoaded = true;
        loaderState.isLoading = false;
        resolve();
      } else {
        const error = new Error('Google Maps API loaded but window.google.maps is not available');
        loaderState.isLoading = false;
        loaderState.loadPromise = null;
        reject(error);
      }
    };

    script.onerror = () => {
      const error = new Error('Failed to load Google Maps API script');
      loaderState.isLoading = false;
      loaderState.loadPromise = null;
      reject(error);
    };

    document.head.appendChild(script);
  });

  return loaderState.loadPromise;
}

/**
 * Resets the loader state (useful for testing)
 */
export function resetLoader(): void {
  loaderState = {
    isLoading: false,
    isLoaded: false,
    loadPromise: null
  };
}

/**
 * Check if Google Maps is already loaded
 */
export function isGoogleMapsLoaded(): boolean {
  return loaderState.isLoaded && !!window.google?.maps;
}

