import type { StateCreator } from 'zustand';
import type { Toast, BottomSheetSize } from '@core/types';
import { generateId } from '@core/utils';

interface BottomSheetState {
  isOpen: boolean;
  size: BottomSheetSize;
  title: string;
  content: React.ReactNode | null;
}

interface ModalState {
  isOpen: boolean;
  title: string;
  content: React.ReactNode | null;
  onClose?: () => void;
}

export interface UISlice {
  toasts: Toast[];
  bottomSheet: BottomSheetState;
  modal: ModalState;
  isLoading: boolean;
  loadingMessage: string;
  searchQuery: string;
  activeTab: string;
  showOnboarding: boolean;
  sidebarOpen: boolean;

  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  openBottomSheet: (
    content: React.ReactNode,
    options?: { size?: BottomSheetSize; title?: string }
  ) => void;
  closeBottomSheet: () => void;
  openModal: (
    content: React.ReactNode,
    options?: { title?: string; onClose?: () => void }
  ) => void;
  closeModal: () => void;
  setLoading: (isLoading: boolean, message?: string) => void;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: string) => void;
  completeOnboarding: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
}

export const createUISlice: StateCreator<UISlice> = (set, get) => ({
  toasts: [],
  bottomSheet: {
    isOpen: false,
    size: 'md',
    title: '',
    content: null
  },
  modal: {
    isOpen: false,
    title: '',
    content: null
  },
  isLoading: false,
  loadingMessage: '',
  searchQuery: '',
  activeTab: '',
  showOnboarding: true,
  sidebarOpen: false,

  addToast: (toast) => {
    const id = generateId();
    const newToast: Toast = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast]
    }));

    const duration = toast.duration ?? 4000;
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  },

  clearAllToasts: () => {
    set({ toasts: [] });
  },

  openBottomSheet: (content, options = {}) => {
    set({
      bottomSheet: {
        isOpen: true,
        size: options.size ?? 'md',
        title: options.title ?? '',
        content
      }
    });
  },

  closeBottomSheet: () => {
    set((state) => ({
      bottomSheet: {
        ...state.bottomSheet,
        isOpen: false
      }
    }));

    setTimeout(() => {
      set({
        bottomSheet: {
          isOpen: false,
          size: 'md',
          title: '',
          content: null
        }
      });
    }, 300);
  },

  openModal: (content, options = {}) => {
    set({
      modal: {
        isOpen: true,
        title: options.title ?? '',
        content,
        onClose: options.onClose
      }
    });
  },

  closeModal: () => {
    const { modal } = get();
    if (modal.onClose) {
      modal.onClose();
    }

    set((state) => ({
      modal: {
        ...state.modal,
        isOpen: false
      }
    }));

    setTimeout(() => {
      set({
        modal: {
          isOpen: false,
          title: '',
          content: null
        }
      });
    }, 200);
  },

  setLoading: (isLoading, message = '') => {
    set({ isLoading, loadingMessage: message });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  completeOnboarding: () => {
    set({ showOnboarding: false });
    localStorage.setItem('sn:onboarding', 'true');
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: (isOpen) => {
    set({ sidebarOpen: isOpen });
  }
});
