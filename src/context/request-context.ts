import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestStore {
  requestId: string;
}

const storage = new AsyncLocalStorage<RequestStore>();

export const requestContext = {
  run<T>(requestId: string, callback: () => T): T {
    return storage.run({ requestId }, callback);
  },

  getRequestId(): string {
    const store = storage.getStore();
    if (!store) {
      throw new Error('Request context is not available');
    }
    return store.requestId;
  },
};
