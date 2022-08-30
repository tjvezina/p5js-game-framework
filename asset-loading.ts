type LoadCallback<T> = (asset: T) => void;
type LoadFunc<T> = (path: string, onComplete?: LoadCallback<T>) => void;

/**
 * Wraps p5 asset loading functions in a Promise for async loading. Resolves with the loaded asset, and accepts an
 * optional callback to allow awaiting assets sequentially or simultaneously.
 *
 * Example 1 - in sequence:
 *    myImage1 = await loadImageAsync('img1.png');
 *    myImage2 = await loadImageAsync('img2.png');
 *
 * Example 2 - simultaneous w/return:
 *    [myImage1, myImage2] = await Promise.all([
 *      loadImageAsync('img1.png'),
 *      loadImageAsync('img2.png'),
 *    ]);
 *
 * Example 3 - simultaneous w/callbacks:
 *    await Promise.all([
 *      loadImageAsync('img1.png', img => { myImage1 = img; }),
 *      loadImageAsync('img2.png', img => { myImage2 = img; }),
 *    ]);
 */
function makeLoadFuncAsync<T>(loadFunc: LoadFunc<T>, path: string, onComplete?: LoadCallback<T>): Promise<T> {
  return new Promise(resolve => loadFunc(path, asset => {
    onComplete?.(asset);
    resolve(asset);
  }));
}

export function loadImageAsync(fileName: string, onComplete?: LoadCallback<p5.Image>): Promise<p5.Image> {
  return makeLoadFuncAsync<p5.Image>(loadImage, `./assets/images/${fileName}`, onComplete);
}

export function loadSoundAsync(filePath: string, onComplete?: LoadCallback<p5.SoundFile>): Promise<p5.SoundFile> {
  return makeLoadFuncAsync<p5.SoundFile>(loadSound, `./assets/audio/${filePath}`, onComplete);
}

export function loadFontAsync(fileName: string, onComplete?: LoadCallback<p5.Font>): Promise<p5.Font> {
  return makeLoadFuncAsync<p5.Font>(loadFont, `./assets/fonts/${fileName}`, onComplete);
}

export function loadModelAsync(fileName: string, onComplete?: LoadCallback<p5.Geometry>): Promise<p5.Geometry> {
  return makeLoadFuncAsync<p5.Geometry>(loadModel, `./assets/models/${fileName}`, onComplete);
}

export function loadStringsAsync(path: string, onComplete?: LoadCallback<string[]>): Promise<string[]> {
  return makeLoadFuncAsync<string[]>(loadStrings, path, onComplete);
}

export function loadJSONAsync(path: string, onComplete?: LoadCallback<object>): Promise<object> {
  return makeLoadFuncAsync<object>(loadJSON, path, onComplete);
}
