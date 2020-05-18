import { PersistentStorage, SingletonPersistentStorage } from "./abstractions";
import { CollectionModel, WorkspaceModel, AppModel } from "./models";

export const app = new SingletonPersistentStorage<AppModel>('app', {});

export const collections = new PersistentStorage<CollectionModel>('collections');

export const workspaces = new PersistentStorage<WorkspaceModel>('workspaces');
