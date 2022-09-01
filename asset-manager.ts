import { assert } from './debug.js';

type Image = p5.Image;
type Sound = p5.SoundFile;
type Font = p5.Font;
type Model = p5.Geometry;
type Asset = Image | Sound | Font | Model;

type LoadCallback<T extends Asset> = (asset: T) => void;
type LoadFunc<T extends Asset> = (path: string, onComplete?: LoadCallback<T>) => void;

const assetMap = new Map<string, Asset>();

function getImagePath(fileName: string): string { return `./assets/images/${fileName}`; }
function getSoundPath(fileName: string): string { return `./assets/audio/${fileName}`; }
function getFontPath(fileName: string): string { return `./assets/fonts/${fileName}`; }
function getModelPath(fileName: string): string { return `./assets/models/${fileName}`; }

async function preloadAsset<T extends Asset>(path: string, loadFunc: LoadFunc<T>): Promise<void> {
  if (!assetMap.has(path)) {
    return new Promise(resolve => loadFunc(path, asset => {
      assetMap.set(path, asset);
      resolve();
    }));
  }
}

async function loadAsset<T extends Asset>(path: string, loadFunc: LoadFunc<T>, onComplete?: LoadCallback<T>): Promise<T> {
  return Promise.resolve(preloadAsset(path, loadFunc)).then(() => {
    const asset = getAsset<T>(path);
    onComplete?.(asset);
    return asset;
  });
}

function getAsset<T extends Asset>(path: string): T {
  assert(assetMap.has(path), `Asset has not been loaded: ${path}`);
  return assetMap.get(path) as T;
}

const AssetManager = {
  async preloadImage(fileName: string): Promise<void> {
    return preloadAsset<Image>(getImagePath(fileName), loadImage);
  },
  async preloadSound(fileName: string): Promise<void> {
    return preloadAsset<Sound>(getSoundPath(fileName), loadSound);
  },
  async preloadFont(fileName: string): Promise<void> {
    return preloadAsset<Font>(getFontPath(fileName), loadFont);
  },
  async preloadModel(fileName: string): Promise<void> {
    return preloadAsset<Model>(getModelPath(fileName), loadModel);
  },

  async loadImage(fileName: string, onComplete?: LoadCallback<Image>): Promise<Image> {
    return loadAsset<Image>(getImagePath(fileName), loadImage, onComplete);
  },
  async loadSound(fileName: string, onComplete?: LoadCallback<Sound>): Promise<Sound> {
    return loadAsset<Sound>(getSoundPath(fileName), loadSound, onComplete);
  },
  async loadFont(fileName: string, onComplete?: LoadCallback<Font>): Promise<Font> {
    return loadAsset<Font>(getFontPath(fileName), loadFont, onComplete);
  },
  async loadModel(fileName: string, onComplete?: LoadCallback<Model>): Promise<Model> {
    return loadAsset<Model>(getModelPath(fileName), loadModel, onComplete);
  },

  getImage(fileName: string): Image { return getAsset<Image>(getImagePath(fileName)); },
  getSound(fileName: string): Sound { return getAsset<Sound>(getSoundPath(fileName)); },
  getFont(fileName: string): Font { return getAsset<Font>(getFontPath(fileName)); },
  getModel(fileName: string): Model { return getAsset<Model>(getModelPath(fileName)); },

  unloadImage(fileName: string): void { assetMap.delete(getImagePath(fileName)); },
  unloadSound(fileName: string): void { assetMap.delete(getSoundPath(fileName)); },
  unloadFont(fileName: string): void { assetMap.delete(getFontPath(fileName)); },
  unloadModel(fileName: string): void { assetMap.delete(getModelPath(fileName)); },

  unloadAll(): void { assetMap.clear(); },
};

export default AssetManager;
