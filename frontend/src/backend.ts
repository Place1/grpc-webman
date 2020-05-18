export interface Backend {
  Domain: Domain;
  Storage: Storage;
}

export interface Domain {
  ListMethods(protofile: string): Promise<string[]>;
  InvokeRPC(protofile: string, server: string, method: string, data: string): Promise<string>;
}

export interface Storage {
  GetItem(key: string): Promise<string>;
  SetItem(key: string, value: string): Promise<void>;
  Clear(): Promise<void>;
}

export let domain: Domain;
export let storage: Storage;

export function setBackend(b: Backend) {
  domain = b.Domain;
  storage = b.Storage;
}
