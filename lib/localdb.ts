import localforage from 'localforage';

// Configure LocalForage only on client side
if (typeof window !== 'undefined') {
  localforage.config({
    driver: localforage.INDEXEDDB,
    name: 'ZamoraHMS',
    version: 1.0,
    storeName: 'keyvalue_pairs',
    description: 'Offline storage for Zamora HMS'
  });
}

// Helper to create a safe instance that doesn't crash SSR
const createSafeInstance = (config: LocalForageOptions): LocalForage => {
  if (typeof window === 'undefined') {
    // Return a dummy implementation for server-side
    return {
      getItem: async () => null,
      setItem: async () => null,
      removeItem: async () => {},
      clear: async () => {},
      length: async () => 0,
      key: async () => null,
      keys: async () => [],
      iterate: async () => null,
      setDriver: async () => {},
      config: () => {},
      defineDriver: async () => {},
      driver: () => '',
      ready: async () => {},
      supports: () => false,
      createInstance: () => createSafeInstance({}),
      dropInstance: async () => {},
    } as unknown as LocalForage;
  }
  return localforage.createInstance(config);
};

// Create instances for different data types
export const transactionsStore = createSafeInstance({
  name: 'ZamoraHMS',
  storeName: 'transactions_queue' // Queue for offline mutations
});

export const roomsStore = createSafeInstance({
  name: 'ZamoraHMS',
  storeName: 'rooms_cache'
});

export const bookingsStore = createSafeInstance({
  name: 'ZamoraHMS',
  storeName: 'bookings_cache'
});

export interface OfflineTransaction {
  id: string;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: number;
  status: 'pending' | 'synced' | 'failed';
}

export const addToSyncQueue = async (transaction: Omit<OfflineTransaction, 'status'>) => {
  if (typeof window === 'undefined') return;
  await transactionsStore.setItem(transaction.id, { ...transaction, status: 'pending' });
};

export const getPendingTransactions = async (): Promise<OfflineTransaction[]> => {
  if (typeof window === 'undefined') return [];
  
  const keys = await transactionsStore.keys();
  const transactions: OfflineTransaction[] = [];
  
  for (const key of keys) {
    const item = await transactionsStore.getItem<OfflineTransaction>(key);
    if (item && item.status === 'pending') {
      transactions.push(item);
    }
  }
  
  return transactions.sort((a, b) => a.timestamp - b.timestamp);
};

export const removeTransaction = async (id: string) => {
  if (typeof window === 'undefined') return;
  await transactionsStore.removeItem(id);
};
