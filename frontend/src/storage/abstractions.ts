import { autorun, observable, computed } from 'mobx';
import { Model } from './models';
import { storage } from '../backend';

export class PersistentStorage<T extends Model> {

  private key: string;

  @observable
  private models = new Map<string, T>();

  constructor(name: string) {
    this.key = name;
  }

  create(value: Pick<T, Exclude<keyof T, 'id'>>): T {
    const model = {
      id: Date.now().toString(),
      ...value,
    } as T;
    this.add(model);
    return model;
  }

  get(id: string): T | undefined {
    return this.models.get(id);
  }

  all(): T[] {
    return Array.from(this.models.values());
  }

  add(value: T) {
    this.models.set(value.id, value);
  }

  delete(id: string) {
    this.models.delete(id);
  }

  async load() {
    const data = await storage.GetItem(this.key);
    if (data) {
      try {
        this.models = new Map(Object.entries(JSON.parse(data)));
      } catch {
        localStorage.clear();
      }
    }
    this.watch();
  }

  private watch() {
    autorun(async () => {
      await storage.SetItem(this.key, JSON.stringify(this.models));
    });
  }

}

export class SingletonPersistentStorage<T> {

  private key: string;
  private storage: PersistentStorage<any>;

  constructor(name: string, defaultValue: T) {
    this.key = name;
    this.storage = new PersistentStorage<any>(name);
    if (!this.storage.get(this.key)) {
      this.storage.create({
        id: this.key,
        ...defaultValue,
      });
    }
  }

  async load() {
    return await this.storage.load();
  }

  @computed
  get value(): T {
    return this.storage.get(this.key);
  }

}
