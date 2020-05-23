import { FileModel } from "./storage/models";

export interface Backend {
  Domain: Domain;
  Storage: Storage;
}

export interface Domain {
  ListMethods(protofile: FileModel[]): Promise<string[]>;
  InvokeRPC(protofile: FileModel[], server: string, method: string, data: string, metadata: Record<string, string>): Promise<string>;
  GetExampleJSON(protofile: FileModel[], method: string): Promise<string>;
  GetFileWithMethod(protofile: FileModel[], method: string): Promise<FileModel>;
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
