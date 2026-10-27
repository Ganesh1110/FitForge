import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalLLMModelInfo } from './types';

export const DEFAULT_MODEL_METADATA: LocalLLMModelInfo = {
  id: 'gemma-2-2b-q4_k_m',
  name: 'Gemma 2 2B Instruct',
  tagline: 'Lightweight on-device quantized model for home routine reasoning',
  sizeBytes: 1580000000, // ~1.47 GB
  formattedSize: '1.47 GB',
  quantization: 'Q4_K_M (4-bit Medium)',
  architecture: 'Gemma 2 / GGUF',
  downloadUrl: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf',
  isDownloaded: false,
  downloadProgress: 0,
  downloadStatus: 'idle',
};

interface ModelStoreState {
  model: LocalLLMModelInfo;
  activeEngine: 'heuristic_rules' | 'on_device_llm';
  setActiveEngine: (engine: 'heuristic_rules' | 'on_device_llm') => void;
  setDownloadProgress: (progress: number) => void;
  setDownloadStatus: (status: LocalLLMModelInfo['downloadStatus'], error?: string) => void;
  markModelDownloaded: (downloaded: boolean) => void;
  resetModel: () => void;
}

export const useModelStore = create<ModelStoreState>()(
  persist(
    (set) => ({
      model: DEFAULT_MODEL_METADATA,
      activeEngine: 'heuristic_rules',

      setActiveEngine: (engine) => set({ activeEngine: engine }),

      setDownloadProgress: (progress) =>
        set((state) => ({
          model: { ...state.model, downloadProgress: progress },
        })),

      setDownloadStatus: (status, error) =>
        set((state) => ({
          model: {
            ...state.model,
            downloadStatus: status,
            errorMessage: error,
            isDownloaded: status === 'ready',
          },
        })),

      markModelDownloaded: (downloaded) =>
        set((state) => ({
          model: {
            ...state.model,
            isDownloaded: downloaded,
            downloadProgress: downloaded ? 100 : 0,
            downloadStatus: downloaded ? 'ready' : 'idle',
          },
        })),

      resetModel: () =>
        set({
          model: DEFAULT_MODEL_METADATA,
          activeEngine: 'heuristic_rules',
        }),
    }),
    {
      name: 'fitforge_model_storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

let activeDownloadInterval: any = null;

export async function simulateOrStartModelDownload(
  onProgress?: (percent: number) => void
): Promise<void> {
  const store = useModelStore.getState();
  store.setDownloadStatus('downloading');

  let current = store.model.downloadProgress || 0;
  clearInterval(activeDownloadInterval);

  return new Promise((resolve) => {
    activeDownloadInterval = setInterval(() => {
      current += 5;
      if (current >= 100) {
        clearInterval(activeDownloadInterval);
        store.setDownloadProgress(100);
        store.setDownloadStatus('ready');
        store.setActiveEngine('on_device_llm');
        onProgress?.(100);
        resolve();
      } else {
        store.setDownloadProgress(current);
        onProgress?.(current);
      }
    }, 200);
  });
}

export function cancelModelDownload(): void {
  clearInterval(activeDownloadInterval);
  const store = useModelStore.getState();
  store.setDownloadStatus('idle');
  store.setDownloadProgress(0);
}

export function deleteLocalModel(): void {
  clearInterval(activeDownloadInterval);
  const store = useModelStore.getState();
  store.markModelDownloaded(false);
  store.setActiveEngine('heuristic_rules');
}
