export interface Model {
  id: string;
}

export interface AppModel {
  activeCollection?: string;
  menuOpen?: boolean;
}

export interface CollectionModel extends Model {
  name: string;
  files: FileModel[];
  activeWorkspace?: string;
}

export interface WorkspaceModel extends Model {
  name: string;
  collectionId: string;
  server?: string;
  selectedRPC?: string;
  requestJSON?: string;
  metadataJSON?: Record<string, string>;
}

export interface FileModel {
  name: string;
  content: string;
}
