import { observable, computed } from "mobx";

export class Loading {

  @observable
  private count = 0;

  @computed
  get active() {
    return this.count !== 0;
  }

  async while(callback: () => Promise<any>) {
    try {
      this.count++
      await callback();
    } finally {
      this.count--
    }
  }
}
