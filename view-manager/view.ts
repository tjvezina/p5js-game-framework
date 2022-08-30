import InputManager from '../input-manager.js';

export default abstract class View {
  isActive = false;

  enable(): void {
    this.isActive = true;
    InputManager.addListener(this);
  }

  disable(): void {
    this.isActive = false;
    InputManager.removeListener(this);
  }

  dispose(): void {
    if (this.isActive) {
      InputManager.removeListener(this);
    }
  }

  async loadContent?(): Promise<void>;

  drawLoadingView?(): void;

  onFocusChanged?(hasFocus: boolean): void;

  update?(): void;

  abstract draw(): void;
}
