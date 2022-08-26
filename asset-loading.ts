export function loadImageAsync(path: string): Promise<p5.Image> {
  return new Promise(resolve => loadImage(path, resolve));
}

export function loadStringsAsync(path: string): Promise<string[]> {
  return new Promise(resolve => loadStrings(path, resolve));
}

export function loadJSONAsync(path: string): Promise<object> {
  return new Promise(resolve => loadJSON(path, resolve));
}

export function loadFontAsync(path: string): Promise<p5.Font> {
  return new Promise(resolve => loadFont(path, resolve));
}

export function loadSoundAsync(path: string): Promise<p5.SoundFile> {
  return new Promise(resolve => loadSound(path, resolve));
}

export function loadModelAsync(path: string): Promise<p5.Geometry> {
  return new Promise(resolve => loadModel(path, resolve));
}
