import { createStore, get, set, del, keys } from 'idb-keyval';
import { JobDocument } from '@/types';

// Custom IndexedDB Store for Field Vault
const offlineVaultStore = typeof window !== 'undefined'
  ? createStore('akr-sop-offline-db', 'proof-upload-vault')
  : (null as unknown as ReturnType<typeof createStore>);

export interface QueuedUploadItem {
  id: string; // queue-${timestamp}-${random}
  jobId: string;
  documentType: JobDocument['documentType'];
  fileName: string;
  fileSize: number;
  mimeType: string;
  base64Data: string;
  previewUrl?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  notes?: string;
  uploadedBy: string;
  uploaderRole: 'SUBCONTRACTOR' | 'ADMIN';
  queuedAt: string;
  retryCount: number;
  status: 'QUEUED' | 'SYNCING' | 'FAILED';
  lastError?: string;
}

type SyncListener = (queuedItems: QueuedUploadItem[]) => void;
const listeners = new Set<SyncListener>();

function notifyListeners(items: QueuedUploadItem[]) {
  listeners.forEach((listener) => {
    try {
      listener(items);
    } catch (err) {
      console.error('[SyncManager] Listener error:', err);
    }
  });
}

/**
 * Enqueue a failed or offline proof-of-work payload into IndexedDB
 */
export async function enqueueOfflineProof(
  payload: Omit<QueuedUploadItem, 'id' | 'queuedAt' | 'retryCount' | 'status'>
): Promise<QueuedUploadItem> {
  if (typeof window === 'undefined') {
    throw new Error('IndexedDB is only accessible in browser runtime');
  }

  const id = `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const item: QueuedUploadItem = {
    ...payload,
    id,
    queuedAt: new Date().toISOString(),
    retryCount: 0,
    status: 'QUEUED',
  };

  await set(id, item, offlineVaultStore);

  // Attempt to register Background Sync API if supported
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      // @ts-expect-error SyncManager is non-standard in TS DOM
      await reg.sync.register('sync-proof-uploads');
    } catch {
      // Ignored if browser rejects or does not support SyncManager
    }
  }

  const all = await getAllQueuedProofs();
  notifyListeners(all);

  // Dispatch custom window event
  window.dispatchEvent(new CustomEvent('akr-queue-updated', { detail: { count: all.length } }));

  return item;
}

/**
 * Retrieve all pending uploads currently in the offline vault
 */
export async function getAllQueuedProofs(): Promise<QueuedUploadItem[]> {
  if (typeof window === 'undefined') return [];

  try {
    const allKeys = await keys(offlineVaultStore);
    const items: QueuedUploadItem[] = [];
    for (const key of allKeys) {
      const val = await get<QueuedUploadItem>(key, offlineVaultStore);
      if (val) items.push(val);
    }
    return items.sort((a, b) => new Date(b.queuedAt).getTime() - new Date(a.queuedAt).getTime());
  } catch (err) {
    console.error('[SyncManager] Failed to read IndexedDB queue:', err);
    return [];
  }
}

/**
 * Retrieve pending uploads for a specific job ID
 */
export async function getQueuedProofsForJob(jobId: string): Promise<QueuedUploadItem[]> {
  const all = await getAllQueuedProofs();
  return all.filter((item) => item.jobId === jobId);
}

/**
 * Remove an item once successfully synced to Supabase Storage
 */
export async function removeQueuedProof(id: string): Promise<void> {
  if (typeof window === 'undefined') return;
  await del(id, offlineVaultStore);
  const remaining = await getAllQueuedProofs();
  notifyListeners(remaining);
  window.dispatchEvent(new CustomEvent('akr-queue-updated', { detail: { count: remaining.length } }));
}

/**
 * Flush all queued proofs to Supabase Storage & the Database API
 */
export async function flushOfflineProofQueue(): Promise<{
  successCount: number;
  failedCount: number;
  syncedDocs: JobDocument[];
}> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { successCount: 0, failedCount: 0, syncedDocs: [] };
  }

  const items = await getAllQueuedProofs();
  if (items.length === 0) {
    return { successCount: 0, failedCount: 0, syncedDocs: [] };
  }

  let successCount = 0;
  let failedCount = 0;
  const syncedDocs: JobDocument[] = [];

  for (const item of items) {
    try {
      item.status = 'SYNCING';
      await set(item.id, item, offlineVaultStore);
      notifyListeners(await getAllQueuedProofs());

      const res = await fetch(`/api/jobs/${item.jobId}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: item.jobId,
          documentType: item.documentType,
          fileName: item.fileName,
          fileSize: item.fileSize,
          mimeType: item.mimeType,
          latitude: item.latitude,
          longitude: item.longitude,
          accuracy: item.accuracy,
          notes: item.notes ? `[OFFLINE SYNCED] ${item.notes}` : '[OFFLINE SYNCED]',
          previewUrl: item.base64Data,
          uploadedBy: item.uploadedBy,
          uploaderRole: item.uploaderRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await removeQueuedProof(item.id);
        successCount++;
        syncedDocs.push(data.document);

        // Notify active job page
        window.dispatchEvent(
          new CustomEvent('akr-proof-synced', {
            detail: { jobId: item.jobId, document: data.document },
          })
        );
      } else {
        throw new Error(data.error || 'Server upload failed');
      }
    } catch (err: unknown) {
      failedCount++;
      item.status = 'FAILED';
      item.retryCount += 1;
      item.lastError = err instanceof Error ? err.message : 'Network error during upload';
      await set(item.id, item, offlineVaultStore);
    }
  }

  const finalItems = await getAllQueuedProofs();
  notifyListeners(finalItems);
  window.dispatchEvent(new CustomEvent('akr-queue-updated', { detail: { count: finalItems.length } }));

  return { successCount, failedCount, syncedDocs };
}

/**
 * Subscribe UI components to live queue changes
 */
export function subscribeToQueue(listener: SyncListener): () => void {
  listeners.add(listener);
  getAllQueuedProofs().then(listener);
  return () => {
    listeners.delete(listener);
  };
}
