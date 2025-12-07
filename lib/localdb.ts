import localforage from 'localforage';

// Configure LocalForage
localforage.config({
  driver: localforage.INDEXEDDB,
  name: 'ZamoraHMS',
  version: 1.0,
  storeName: 'keyvalue_pairs',
  description: 'Offline storage for Zamora HMS'
});

// Create instances for different data types
export const transactionsStore = localforage.createInstance({
  name: 'ZamoraHMS',
  storeName: 'transactions_queue' // Queue for offline mutations
});

export const roomsStore = localforage.createInstance({
  name: 'ZamoraHMS',
  storeName: 'rooms_cache'
});

export const bookingsStore = localforage.createInstance({
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
  await transactionsStore.setItem(transaction.id, { ...transaction, status: 'pending' });
};

export const getPendingTransactions = async (): Promise<OfflineTransaction[]> => {
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
  await transactionsStore.removeItem(id);
};
