import View from './view.js';
import ViewManager from './view-manager.js';

export default abstract class PopupView extends View {
  close(): void {
    ViewManager.closePopup();
  }
}
