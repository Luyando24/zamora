import { supabase } from './supabase';
import { getPendingTransactions, removeTransaction, OfflineTransaction } from './localdb';

export const processSyncQueue = async () => {
  if (!navigator.onLine) return;

  console.log('Starting sync process...');
  const transactions = await getPendingTransactions();

  for (const tx of transactions) {
    try {
      console.log(`Processing transaction ${tx.id} (${tx.action} on ${tx.table})`);
      
      let error = null;

      if (tx.action === 'INSERT') {
        const { error: insertError } = await supabase.from(tx.table).insert(tx.payload);
        error = insertError;
      } else if (tx.action === 'UPDATE') {
        // Assuming payload has an id or we use a separate id field. 
        // For simplicity, let's assume payload contains the id.
        const { id, ...updates } = tx.payload;
        if (!id) throw new Error('Update requires ID');
        const { error: updateError } = await supabase.from(tx.table).update(updates).eq('id', id);
        error = updateError;
      } else if (tx.action === 'DELETE') {
        const { id } = tx.payload;
        if (!id) throw new Error('Delete requires ID');
        const { error: deleteError } = await supabase.from(tx.table).delete().eq('id', id);
        error = deleteError;
      }

      if (error) {
        console.error(`Failed to sync transaction ${tx.id}:`, error);
        // Logic to handle conflict or permanent failure
        // For now, we might leave it in pending or mark as failed
      } else {
        console.log(`Successfully synced transaction ${tx.id}`);
        await removeTransaction(tx.id);
      }

    } catch (e) {
      console.error(`Unexpected error syncing transaction ${tx.id}:`, e);
    }
  }
};
