import Phaser from 'phaser';

// Under WebGL, Phaser re-triangulates every Graphics object on every frame, even
// when it never changes. Shapes that are drawn once (panels, dials, trays) are
// baked into a texture here and shown as a plain image instead, which costs almost
// nothing to draw.
//
// (x, y, w, h) is the area to keep, in the Graphics' parent coordinates. `res`
// renders at a higher resolution, for images that get scaled up by tweens.

// Draws `g` into a texture under `key` (leaving `g` alone). Returns the key.
export function bakeTexture(
  g: Phaser.GameObjects.Graphics,
  key: string,
  x: number,
  y: number,
  w: number,
  h: number,
  res = 1,
): string {
  const scene = g.scene;
  // Textures outlive scene restarts, so replace rather than pile up copies
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.addDynamicTexture(key, Math.ceil(w * res), Math.ceil(h * res))!;
  const { scaleX, scaleY } = g;
  g.setScale(scaleX * res, scaleY * res);
  tex.draw(g, (g.x - x) * res, (g.y - y) * res).render();
  g.setScale(scaleX, scaleY);
  return key;
}

// Bakes `g` and swaps in an image that takes its place in its container or the
// display list, so layering is unchanged.
export function bakeGraphics(
  g: Phaser.GameObjects.Graphics,
  key: string,
  x: number,
  y: number,
  w: number,
  h: number,
  res = 1,
): Phaser.GameObjects.Image {
  const scene = g.scene;
  bakeTexture(g, key, x, y, w, h, res);
  const container = g.parentContainer;
  const config: Phaser.Types.GameObjects.Sprite.SpriteConfig = { x, y, key };
  const img = scene.make.image(config, !container)
    .setOrigin(0).setScale(1 / res).setDepth(g.depth).setAlpha(g.alpha);
  if (container) {
    container.replace<Phaser.GameObjects.GameObject>(g, img, true);
  } else {
    scene.children.moveAbove(img, g);
    g.destroy();
  }
  return img;
}
