export default class Sprite {
  static load(filePath: string, cols: number, rows: number, frameRate: number, callback: (sprite: Sprite) => void): void {
    loadImage(filePath, result => {
      callback(new Sprite(result, cols, rows, frameRate));
    });
  }

  spriteSheet: p5.Image;
  rows: number;
  cols: number;
  frameRate: number;

  frameTime = 0;

  loop: boolean;

  isComplete = false;

  constructor(spriteSheet: p5.Image, cols: number, rows: number, frameRate: number, loop = true) {
    this.spriteSheet = spriteSheet;
    this.rows = rows;
    this.cols = cols;
    this.frameRate = frameRate;
    this.loop = loop;
  }

  get frameWidth(): number { return this.spriteSheet.width / this.cols; }
  get frameHeight(): number { return this.spriteSheet.height / this.rows; }

  update(): void {
    if (this.isComplete) return;

    const loopTime = (this.rows * this.cols) / this.frameRate;
    this.frameTime = (this.frameTime + (deltaTime/1000));

    if (this.frameTime >= loopTime) {
      if (this.loop) {
        this.frameTime -= loopTime;
      } else {
        this.frameTime = loopTime;
        this.isComplete = true;
      }
    }
  }

  draw(x: number, y: number, width?: number, height?: number, rot = 0): void {
    const { spriteSheet, cols, frameWidth, frameHeight, frameRate, frameTime } = this;

    const frameIndex = floor(frameTime * frameRate);
    const xFrame = frameIndex % cols;
    const yFrame = floor(frameIndex / cols);

    const sx = frameWidth * xFrame;
    const sy = frameHeight * yFrame;

    push();
    {
      translate(x, y);
      rotate(rot);
      imageMode(CENTER);
      image(spriteSheet, 0, 0, width ?? frameWidth, height ?? frameHeight, sx, sy, frameWidth, frameHeight);
    }
    pop();
  }
}
