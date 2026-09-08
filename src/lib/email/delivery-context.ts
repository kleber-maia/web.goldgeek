import { AsyncLocalStorage } from 'node:async_hooks';

export const deliveryContext = new AsyncLocalStorage<string>();
