import { assert } from '../debug.js';
import PopupView from './popup-view.js';
import View from './view.js';

const FADE_TIME = 0.25;

let currentView: View | null = null;
let popupView: PopupView | null = null;

let pendingView: View | null = null;
let tFade = 0;
let transitionFunc: (() => boolean) | null = null;

let isLoadingNextView = false;
let tLoadingFade = 0;

let drawCustomLoadingView: (() => void) | null = null;

let documentHadFocus = true;

/**
 * A basic view manager that handles one view at a time, and one popup/overlay.
 */
const ViewManager = {
  get isInTransition(): boolean { return tFade < 1; },

  get popupIsOpen(): boolean { return popupView !== null; },

  /**
   * Fades out the current view if any, then loads and fades into the next view.
   * @param nextView The view to transition to next
   */
  transitionTo(nextView: View): void {
    assert(!(nextView instanceof PopupView), 'Transition failed, primary view cannot be a popup');

    // Even if there's already a pending view, or we're fading in, begin/continue fading out
    pendingView = nextView;
    transitionFunc = fadeOut;
  },

  /**
   * Opens a popup view over the current primary view
   * @param popup The popup to open
   */
  openPopup(popup: PopupView): void {
    assert(popupView === null, 'Failed to open popup, one is already open');
    assert(currentView !== null, 'Failed to open popup, transition to a view first');

    currentView.disable();
    popupView = popup;
    popupView.enable();
  },

  /**
   * Closes the current popup view
   */
  closePopup(): void {
    assert(popupView !== null, 'Failed to close popup, no popup to close');
    assert(currentView !== null, 'Failed to close popup, transition to a view first');

    popupView.dispose();
    popupView = null;
    currentView.enable();
  },

  /**
   * Sets a custom loading view draw function. When waiting for a view's `loadContent` to execute, the given function
   * will be called to draw a loading indicator to the screen. If no custom function is set, a default is used.
   * @param drawLoadingView The function to call when rendering the loading view
   */
  setLoadingViewFunc(drawLoadingView: (() => void) | null): void {
    drawCustomLoadingView = drawLoadingView;
  },

  /**
   * Updates the current screen and popup, if set and focused, and updates transitions between screens.
   */
  update(): void {
    const documentHasFocus = document.hasFocus();
    if (documentHasFocus !== documentHadFocus) {
      documentHadFocus = documentHasFocus;
      currentView?.onFocusChanged?.(documentHasFocus);
      popupView?.onFocusChanged?.(documentHasFocus);
    }

    if (transitionFunc?.() === true) {
      transitionFunc = null;

      if (pendingView !== null) {
        loadNextView();
      }
    }

    if (document.hasFocus()) {
      currentView?.update?.();
      popupView?.update?.();
    }
  },

  /**
   * Draws the current screen and popup, if set and visible, and draws transitions and loading views.
   */
  draw(): void {
    if (!isLoadingNextView) {
      push();
      currentView?.draw();
      pop();

      push();
      popupView?.draw();
      pop();
    }

    if (tFade < 1) {
      background(0, 255 * (1 - tFade));
    }

    if (isLoadingNextView === true) {
      if (currentView?.drawLoadingView !== undefined) {
        currentView.drawLoadingView();
      } else if (drawCustomLoadingView !== null) {
        drawCustomLoadingView();
      } else {
        drawDefaultLoadingView();
      }
    }
  },
};

async function loadNextView(): Promise<void> {
  assert(pendingView !== null, 'Failed to load next view, no view is pending');

  isLoadingNextView = true;
  tLoadingFade = 0;

  popupView?.dispose();
  popupView = null;

  currentView?.dispose();
  currentView = pendingView;
  pendingView = null;

  await currentView.loadContent?.();

  currentView.enable();
  isLoadingNextView = false;
  transitionFunc = fadeIn;
}

function fadeIn(): boolean {
  tFade = min(1, tFade + (deltaTime/1000) / FADE_TIME);
  return (tFade === 1);
}

function fadeOut(): boolean {
  tFade = max(0, tFade - (deltaTime/1000) / FADE_TIME);
  return (tFade === 0);
}

function drawDefaultLoadingView(): void {
  tLoadingFade = min(1, tLoadingFade + (deltaTime/1000) / FADE_TIME);

  push();
  {
    textAlign(CENTER, CENTER);
    textSize(height/20);
    textStyle(BOLD);
    fill(200, 255 * tLoadingFade).noStroke();
    text('Loading...', width/2, height/2);
  }
  pop();
}

export default ViewManager;
