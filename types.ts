export enum Tab {
  TEXT_TO_IMAGE = 'text-to-image',
  IMAGE_TO_IMAGE = 'image-to-image',
  UPSCALER = 'upscaler',
  PROMPT_ENHANCER = 'prompt-enhancer',
  CAPTION_GENERATOR = 'caption-generator',
  STORYBOARD_CREATOR = 'storyboard-creator',
  MY_CREATIONS = 'my-creations',
}

export interface User {
  email: string;
  isPremium: boolean;
}

export interface Base64Image {
    mimeType: string;
    data: string;
}

export interface Creation {
  id: string;
  tab: Tab;
  prompt: string;
  timestamp: string;
  imageUrl?: string; 
  resultImageUrl?: string; 
  resultText?: string;
  storyboardUrls?: string[];
}


// FIX: Defined a new `AIStudio` interface to ensure that all declarations of
// `window.aistudio` use a consistent type. This resolves an error where an
// inline object type conflicted with an existing declaration that expected
// the named type `AIStudio`.

// FIX: To resolve conflicting global declarations, the AIStudio interface is now defined within the `declare global` block.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // FIX: Made `aistudio` optional to fix error "All declarations of 'aistudio' must have identical modifiers."
    aistudio?: AIStudio;
  }
}