import type { StateCreator } from 'zustand';
import type { ShoppingList, ShoppingListItem, Product } from '@core/types';
import { shoppingListRepo, productRepo } from '@services/db';
import { generateId } from '@core/utils';

export interface ShoppingListSlice {
  lists: ShoppingList[];
  currentList: ShoppingList | null;
  recentProducts: Product[];
  isLoading: boolean;
  error: string | null;

  initializeLists: () => Promise<void>;
  createList: (name: string, isDefault?: boolean) => Promise<ShoppingList>;
  setCurrentList: (listId: string) => Promise<void>;
  addItem: (product: Product, quantity?: number, priority?: ShoppingListItem['priority']) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  toggleItemChecked: (itemId: string) => Promise<void>;
  updateItemPriority: (itemId: string, priority: ShoppingListItem['priority']) => Promise<void>;
  clearCheckedItems: () => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  optimizeOrder: () => Promise<void>;
  addToRecent: (product: Product) => void;
  getProgress: () => { total: number; checked: number; percentage: number };
  getEstimatedCost: () => number;
}

export const createShoppingListSlice: StateCreator<ShoppingListSlice> = (set, get) => ({
  lists: [],
  currentList: null,
  recentProducts: [],
  isLoading: false,
  error: null,

  initializeLists: async () => {
    set({ isLoading: true });

    try {
      const lists = await shoppingListRepo.getAll();

      if (lists.length === 0) {
        const defaultList = await get().createList('My Shopping List', true);
        set({
          lists: [defaultList],
          currentList: defaultList,
          isLoading: false
        });
      } else {
        const defaultList = lists.find((l) => l.isDefault) ?? lists[0];
        set({
          lists,
          currentList: defaultList,
          isLoading: false
        });
      }
    } catch {
      set({ isLoading: false, error: 'Failed to load shopping lists' });
    }
  },

  createList: async (name, isDefault = false) => {
    const list: ShoppingList = {
      id: generateId(),
      name,
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault,
      totalEstimatedCost: 0
    };

    await shoppingListRepo.save(list);

    set((state) => ({
      lists: [...state.lists, list]
    }));

    return list;
  },

  setCurrentList: async (listId) => {
    const list = await shoppingListRepo.getById(listId);
    if (list) {
      set({ currentList: list });
    }
  },

  addItem: async (product, quantity = 1, priority = 'medium') => {
    let { currentList } = get();

    if (!currentList) {
      currentList = await get().createList('My Shopping List', true);
    }

    const existingItem = currentList.items.find(
      (item) => item.productId === product.id
    );

    let updatedList: ShoppingList;

    if (existingItem) {
      updatedList = {
        ...currentList,
        items: currentList.items.map((item) =>
          item.id === existingItem.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ),
        updatedAt: Date.now()
      };
    } else {
      const newItem: ShoppingListItem = {
        id: generateId(),
        productId: product.id,
        product,
        quantity,
        isChecked: false,
        addedAt: Date.now(),
        priority
      };

      updatedList = {
        ...currentList,
        items: [...currentList.items, newItem],
        updatedAt: Date.now()
      };
    }

    await shoppingListRepo.save(updatedList);

    set((state) => ({
      currentList: updatedList,
      lists: state.lists.map((l) => (l.id === updatedList.id ? updatedList : l))
    }));

    get().addToRecent(product);
  },

  removeItem: async (itemId) => {
    const { currentList } = get();
    if (!currentList) return;

    const updatedList = {
      ...currentList,
      items: currentList.items.filter((item) => item.id !== itemId),
      updatedAt: Date.now()
    };

    await shoppingListRepo.save(updatedList);

    set((state) => ({
      currentList: updatedList,
      lists: state.lists.map((l) => (l.id === updatedList.id ? updatedList : l))
    }));
  },

  updateItemQuantity: async (itemId, quantity) => {
    const { currentList } = get();
    if (!currentList) return;

    if (quantity <= 0) {
      await get().removeItem(itemId);
      return;
    }

    const updatedList = {
      ...currentList,
      items: currentList.items.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      ),
      updatedAt: Date.now()
    };

    await shoppingListRepo.save(updatedList);

    set((state) => ({
      currentList: updatedList,
      lists: state.lists.map((l) => (l.id === updatedList.id ? updatedList : l))
    }));
  },

  toggleItemChecked: async (itemId) => {
    const { currentList } = get();
    if (!currentList) return;

    const updatedList = {
      ...currentList,
      items: currentList.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              isChecked: !item.isChecked,
              checkedAt: !item.isChecked ? Date.now() : undefined
            }
          : item
      ),
      updatedAt: Date.now()
    };

    await shoppingListRepo.save(updatedList);

    set((state) => ({
      currentList: updatedList,
      lists: state.lists.map((l) => (l.id === updatedList.id ? updatedList : l))
    }));
  },

  updateItemPriority: async (itemId, priority) => {
    const { currentList } = get();
    if (!currentList) return;

    const updatedList = {
      ...currentList,
      items: currentList.items.map((item) =>
        item.id === itemId ? { ...item, priority } : item
      ),
      updatedAt: Date.now()
    };

    await shoppingListRepo.save(updatedList);

    set((state) => ({
      currentList: updatedList,
      lists: state.lists.map((l) => (l.id === updatedList.id ? updatedList : l))
    }));
  },

  clearCheckedItems: async () => {
    const { currentList } = get();
    if (!currentList) return;

    const updatedList = {
      ...currentList,
      items: currentList.items.filter((item) => !item.isChecked),
      updatedAt: Date.now()
    };

    await shoppingListRepo.save(updatedList);

    set((state) => ({
      currentList: updatedList,
      lists: state.lists.map((l) => (l.id === updatedList.id ? updatedList : l))
    }));
  },

  deleteList: async (listId) => {
    await shoppingListRepo.delete(listId);

    set((state) => {
      const remaining = state.lists.filter((l) => l.id !== listId);
      return {
        lists: remaining,
        currentList:
          state.currentList?.id === listId
            ? remaining[0] ?? null
            : state.currentList
      };
    });
  },

  optimizeOrder: async () => {
    const { currentList } = get();
    if (!currentList) return;

    const sortedItems = [...currentList.items].sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });

    const updatedList = {
      ...currentList,
      items: sortedItems,
      updatedAt: Date.now()
    };

    await shoppingListRepo.save(updatedList);

    set((state) => ({
      currentList: updatedList,
      lists: state.lists.map((l) => (l.id === updatedList.id ? updatedList : l))
    }));
  },

  addToRecent: (product) => {
    set((state) => {
      const filtered = state.recentProducts.filter((p) => p.id !== product.id);
      return {
        recentProducts: [product, ...filtered].slice(0, 20)
      };
    });
  },

  getProgress: () => {
    const { currentList } = get();
    if (!currentList) return { total: 0, checked: 0, percentage: 0 };

    const total = currentList.items.length;
    const checked = currentList.items.filter((i) => i.isChecked).length;
    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;

    return { total, checked, percentage };
  },

  getEstimatedCost: () => {
    const { currentList } = get();
    if (!currentList) return 0;

    return currentList.items.reduce((sum, item) => {
      const price = item.product.isOnSale && item.product.discountPercentage
        ? item.product.price * (1 - item.product.discountPercentage / 100)
        : item.product.price;
      return sum + price * item.quantity;
    }, 0);
  }
});
