export interface Model {
  id: string;
}

export interface AppModel {
  activeCollection?: string;
}

export interface CollectionModel extends Model {
  name: string;
  protofile?: string;
  activeWorkspace?: string;
}

export interface WorkspaceModel extends Model {
  name: string;
  collectionId: string;
  server?: string;
  selectedRPC?: string;
  requestJSON?: string;
}
