const INPUT_EVENT_TYPES = [
  'mouseClicked',
  'mousePressed',
  'mouseReleased',
  'doubleClicked',
  'mouseMoved',
  'mouseDragged',
  'mouseWheel',
  'keyPressed',
  'keyReleased',
  'keyTyped',
] as const;
type InputEventType = typeof INPUT_EVENT_TYPES[number];

type InputEventListener = object;
type InputEventCallback = (event?: Event) => void;

// All listeners currently registered
const listenerSet = new Set<InputEventListener>();
// Maps each event type to the specific listeners who care about it
const listenerMap = new Map<InputEventType, InputEventListener[]>();
// If a global definition for an event existed before InputManager, keep a reference for restoring
const prevEventFuncMap = new Map<InputEventType, InputEventCallback>();

let pointerLockIsRequired = false;
let lastPointerLockChangeTime = -Infinity;

const InputManager = {
  get hasPointerLock(): boolean { return document.pointerLockElement !== null; },

  /**
   * Sets up callbacks for input events on the given listener. Any p5 input event functions (ex. 'mouseClicked')
   * are automatically found and set up to receive callbacks when the corresponding event fires.
   * @param listener The object to set up input callbacks for
   */
  addListener(listener: InputEventListener): void {
    if (listenerSet.has(listener)) {
      return;
    }
    listenerSet.add(listener);

    for (const eventType of INPUT_EVENT_TYPES.filter(eventType => listener[eventType] !== undefined)) {
      if (!listenerMap.has(eventType)) {
        wrapEvent(eventType);
        listenerMap.set(eventType, []);
      }
      listenerMap.get(eventType)?.push(listener);
    }
  },

  /**
   * Removes a listener from the callback system.
   * @param listener The listener to remove callbacks for
   */
  removeListener(listener: InputEventListener): void {
    if (!listenerSet.has(listener)) {
      return;
    }
    listenerSet.delete(listener);

    for (const [eventType, listenerList] of [...listenerMap]) {
      if (listenerList.includes(listener)) {
        listenerList.splice(listenerList.indexOf(listener), 1);
        if (listenerList.length === 0) {
          listenerMap.delete(eventType);
          unwrapEvent(eventType);
        }
      }
    }
  },

  /**
   * Automatically locks the cursor on click, and ignores input events unless the cursor is locked.
   * Call once in setup to enable for the project.
   */
  requirePointerLock(): void {
    pointerLockIsRequired = true;

    document.addEventListener('pointerlockchange', () => {
      lastPointerLockChangeTime = millis();
    });

    document.addEventListener('mousedown', () => {
      if (!InputManager.hasPointerLock && millis() - lastPointerLockChangeTime > 1500) {
        requestPointerLock();
      }
    });
  },
};

/**
 * Dispatches an input event to all listeners, if certain conditions are met.
 * @param eventType The input event type being dispatched
 * @param event The associated Event object
 */
async function tryDispatchEvent(eventType: InputEventType, event?: Event): Promise<void> {
  if (pointerLockIsRequired && !InputManager.hasPointerLock) return;

  listenerMap.get(eventType)?.forEach(listener => (listener[eventType] as InputEventCallback).apply(listener, event));
}

/**
 * Creates a global function to listen to input events from p5. If a global function for the event already exists,
 * it is wrapped by the new function to ensure both are executed.
 * @param eventType The input event to wrap
 */
function wrapEvent(eventType: InputEventType): void {
  const eventFunc = function (event?: Event): void { tryDispatchEvent(eventType, event); };
  const prevEventFunc: InputEventCallback = globalThis[eventType];

  if (prevEventFunc === undefined) {
    globalThis[eventType] = eventFunc;
  } else {
    globalThis[eventType] = function (event?: Event): void {
      eventFunc(event);
      prevEventFunc(event);
    };
    prevEventFuncMap.set(eventType, prevEventFunc);
  }
}

/**
 * Removes the global function for a given input event. If a previous function was wrapped,
 * it is unwrapped and restored.
 * @param eventType The input event to unwrap
 */
function unwrapEvent(eventType: InputEventType): void {
  if (prevEventFuncMap.has(eventType)) {
    globalThis[eventType] = prevEventFuncMap.get(eventType) as InputEventCallback;
    prevEventFuncMap.delete(eventType);
  } else {
    delete globalThis[eventType];
  }
}

export default InputManager;
