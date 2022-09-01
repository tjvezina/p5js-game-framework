import InputManager from '../input-manager.js';
import ViewManager from './view-manager.js';

export enum ViewState {
  Pending, // Waiting for previous view to exit
  Loading, // Loading assets, not yet visible
  Entering, // Loading complete, transitioning onto screen
  Active, // Visible and receiving input
  Exiting, // Transitioning off screen
}

const DEFAULT_TRANSITION_TIME = 0.25;

export default abstract class View {
  state = ViewState.Pending;
  isEnabled = false;

  enterTime = DEFAULT_TRANSITION_TIME;
  exitTime = DEFAULT_TRANSITION_TIME;
  doEnterFade = true;
  doExitFade = true;
  transitionPos = 0;

  // Run before the view enters the screen
  async loadAssets?(): Promise<void>;

  // Called while laodContent() executes
  drawLoadingIndicator?(): void;

  // Run after loading is complete, before becoming visible
  init?(): void;

  // Run after exiting
  dispose(): void {
    this.onDispose?.();
    if (this.isEnabled) {
      InputManager.removeListener(this);
    }
  }

  // Run any time the view becomes active, ex. after loading, or returning from another view
  enable(): void {
    this.isEnabled = true;
    InputManager.addListener(this);
    this.onEnable?.();
  }

  // Run any time the view becomes inactive, ex. when covered by another view
  disable(): void {
    this.isEnabled = false;
    InputManager.removeListener(this);
    this.onDisable?.();
  }

  /* Life cycle callbacks */

  onDispose?(): void;

  // Callback when the view is enabled or disabled
  onEnable?(): void;
  onDisable?(): void;

  // Callback when the window gains or focus
  onFocus?(): void;
  onBlur?(): void;

  // Update and draw are called every animation frame (i.e. not called when the window his hidden)
  // Each frame, all views are updated, then all views are drawn
  update?(): void;
  abstract draw(): void;

  exit(): void {
    ViewManager.exitView(this);
  }
}
