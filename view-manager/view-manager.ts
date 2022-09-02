import { assert } from '../debug.js';
import View, { ViewState } from './view.js';

const layerList: ViewLayer[] = [];

let loadingIndicatorDrawFunc = drawDefaultLoadingIndicator;

let didBecomeVisible = false;

document.addEventListener('visibilitychange', () => { didBecomeVisible = (!document.hidden); });
window.addEventListener('focus', () => {
  layerList.forEach(layer => {
    if (layer.view !== null && layer.view.state !== ViewState.Loading) {
      layer.view?.onFocus?.();
    }
  });
  updateEnabledStates();
});
window.addEventListener('blur', () => {
  layerList.forEach(layer => {
    if (layer.view !== null && layer.view.state !== ViewState.Loading) {
      layer.view?.onBlur?.();
    }
  });
  updateEnabledStates();
});

class ViewLayer {
  view: View | null = null;
  pendingView: View | null = null;

  transitionTo(nextView: View): void {
    assert(this.view === null || this.view.state === ViewState.Active,
      'View transition failed, already transitioning to another view',
    );

    if (this.view !== null) {
      this.pendingView = nextView;
      this.exitView();
    } else {
      this.view = nextView;
      this.loadView();
    }
  }

  exitView(): void {
    if (this.view !== null) {
      assert(this.view.state === ViewState.Active, 'Failed to exit view, still transitioning in');
      this.view.state = ViewState.Exiting;
      if (this.view.isEnabled) {
        this.view.disable();
      }
    }
  }

  update(): void {
    if (this.view === null) return;

    switch (this.view.state) {
      case ViewState.Entering: {
        if (this.view.enterTime > 0 && this.view.transitionPos < 1) {
          this.view.transitionPos += (deltaTime/1000) / this.view.enterTime;
        } else {
          this.view.state = ViewState.Active;

          onViewEntered();
        }
        break;
      }
      case ViewState.Exiting: {
        if (this.view.exitTime > 0 && this.view.transitionPos > 0) {
          this.view.transitionPos -= (deltaTime/1000) / this.view.exitTime;
        } else {
          this.view.dispose();

          if (this.pendingView !== null) {
            this.view = this.pendingView;
            this.loadView();
          }

          onViewExited();
        }
        break;
      }
    }

    if (this.view.state !== ViewState.Loading) {
      this.view.update?.();
    }
  }

  draw(): void {
    if (this.view === null) return;

    push();
    if (this.view.state === ViewState.Loading) {
      if (this.view.drawLoadingIndicator !== undefined) {
        this.view.drawLoadingIndicator();
      } else {
        loadingIndicatorDrawFunc();
      }
    } else {
      this.view.draw();

      if (
        (this.view.state === ViewState.Entering && this.view.doEnterFade) ||
        (this.view.state === ViewState.Exiting && this.view.doExitFade)
      ) {
        background(0, 255 * (1 - this.view.transitionPos));
      }
    }
    pop();
  }

  async loadView(): Promise<void> {
    assert(this.view !== null, 'Failed to load view, no view to load');
    if (this.view.loadAssets !== undefined) {
      this.view.state = ViewState.Loading;
      await this.view.loadAssets();
    }

    this.view.state = ViewState.Entering;
    this.view.init?.();
    if (!document.hasFocus()) {
      this.view.onBlur?.();
    }
  }
}

const ViewManager = {
  /**
   * Sets the draw function to use for rendering a loading indicator between views, if the view doesn't define one.
   */
  setLoadingIndicatorDrawFunc(func: () => void): void {
    loadingIndicatorDrawFunc = func;
  },

  /**
   * Transitions to a new view, exiting the previous view if necessary
   * @param view The view to transition to
   * @param options.layer Specifies the layer index to push the view to
   * NOTE: Apps could define a custom `Layer` enum to easily track and modify layers.
   */
  transitionTo(view: View, { layer }: { layer: number } = { layer: 0 }): void {
    assert(layerList.every(layer => layer.view === null || layer.view.state === ViewState.Active),
      'View transition failed, a view is already transitioning',
    );
    assert(layer >= 0 && Number.isInteger(layer), 'View transition failed, layer must be a positive integer');
    if (layerList[layer] === undefined) {
      layerList[layer] = new ViewLayer();
    }
    layerList[layer]?.transitionTo(view);
  },

  /**
   * Exits the given view, transitioning out and leaving its layer empty.
   * @param view The view to exit
   */
  exitView(view: View): void {
    const layer = layerList.find(layer => layer?.view === view);
    assert(layer !== undefined, 'Failed to exit view, not found in view layers');
    layer.exitView();
  },

  /**
   * Exits the view on the given layer, if any.
   * @param layer The layer to clear
   */
  clearLayer(layer: number): void {
    layerList[layer]?.exitView();
  },

  /**
   * A list of currently visible views
   */
  get views(): View[] { return layerList.map(layer => layer.view).filter(view => view !== null) as View[]; },

  update(): void {
    // When the window is hidden (document.hidden) the browser stops running animation frames to save power; however,
    // when the draw loop resumes, the first frame has a massive deltaTime (however long the window was hidden for).
    // To correct this, on the first frame after becoming visible, overwrite deltaTime to a more reasonable value.
    if (didBecomeVisible) {
      didBecomeVisible = false;
      deltaTime = 1000/60;
    }

    layerList.forEach(layer => layer?.update());
  },

  draw(): void {
    layerList.forEach(layer => layer?.draw());
  },
};

function onViewEntered(): void { updateEnabledStates(); }
function onViewExited(): void { updateEnabledStates(); }

function updateEnabledStates(): void {
  let isEnabled = document.hasFocus();
  [...layerList].reverse().forEach(layer => {
    if (layer === undefined || layer.view === null) return;

    isEnabled &&= (layer.view.state === ViewState.Active);

    if (layer.view.isEnabled !== isEnabled) {
      if (isEnabled) {
        layer.view.enable();
      } else {
        layer.view.disable();
      }
    }

    isEnabled = false;
  });
}

function drawDefaultLoadingIndicator(): void {
  push();
  {
    background(0);
    textAlign(CENTER, CENTER);
    textSize(height/20);
    textStyle(BOLD);
    fill(200).noStroke();
    text('Loading...', width/2, height/2);
  }
  pop();
}

export default ViewManager;
