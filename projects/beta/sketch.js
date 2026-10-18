// =========================================================
// 2D SCENE RENDERER — FIRST OBJECT-ORIENTED PROTOTYPE
// =========================================================
//
// Current scene:
// - Scene
// - WindowObject
// - Desk
//
// PixiJS handles rendering.
// Our classes define the scene structure.
//
// =========================================================

// =========================================================
// SCENE
// =========================================================

class Scene {
  constructor(app) {
    this.app = app;

    // Main container for all scene objects.
    this.world = new PIXI.Container();

    // Add the world container to Pixi's root stage.
    this.app.stage.addChild(this.world);

    // Keep references to the objects in the scene.
    this.objects = [];
  }

  addObject(object) {
    this.objects.push(object);

    this.world.addChild(object.container);
  }
}

// =========================================================
// BASE SCENE OBJECT
// =========================================================
//
// Every room object shares:
// - x position
// - y position
// - Pixi container
//
// Child classes decide what geometry they contain.
//
// =========================================================

class SceneObject {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    this.container = new PIXI.Container();

    this.container.x = this.x;

    this.container.y = this.y;
  }
}

// =========================================================
// WINDOW
// =========================================================

class WindowObject extends SceneObject {
  constructor(x, y, width, height) {
    super(x, y);

    this.width = width;
    this.height = height;

    this.draw();
  }

  draw() {
    const graphics = new PIXI.Graphics();

    // Glass
    graphics.rect(0, 0, this.width, this.height).fill(0xcfe3e8);

    // Outer frame
    graphics.rect(0, 0, this.width, this.height).stroke({
      width: 10,
      color: 0x303743,
    });

    // Middle mullion
    graphics
      .moveTo(this.width / 2, 0)
      .lineTo(this.width / 2, this.height)
      .stroke({
        width: 10,
        color: 0x303743,
      });

    this.container.addChild(graphics);
  }
}

// =========================================================
// DESK
// =========================================================

class Desk extends SceneObject {
  constructor(x, y, width, topHeight, legHeight) {
    super(x, y);

    this.width = width;
    this.topHeight = topHeight;
    this.legHeight = legHeight;

    this.draw();
  }

  draw() {
    const graphics = new PIXI.Graphics();

    // -----------------------------------------------------
    // Desk top
    // -----------------------------------------------------

    graphics.rect(0, 0, this.width, this.topHeight).fill(0xc99968);

    // Darker front edge
    graphics.rect(0, this.topHeight - 6, this.width, 6).fill(0xa66f48);

    // -----------------------------------------------------
    // Legs
    // -----------------------------------------------------

    const legWidth = 20;

    graphics.rect(30, this.topHeight, legWidth, this.legHeight).fill(0x41444b);

    graphics
      .rect(
        this.width - 30 - legWidth,
        this.topHeight,
        legWidth,
        this.legHeight,
      )
      .fill(0x41444b);

    this.container.addChild(graphics);
  }
}

// =========================================================
// APPLICATION
// =========================================================

async function start() {
  const app = new PIXI.Application();

  await app.init({
    width: 900,
    height: 600,
    background: "#d7d0c5",
    antialias: true,
  });

  document.getElementById("scene-holder").appendChild(app.canvas);

  // -------------------------------------------------------
  // CREATE SCENE
  // -------------------------------------------------------

  const scene = new Scene(app);

  // -------------------------------------------------------
  // CREATE WINDOW
  // -------------------------------------------------------

  const windowObject = new WindowObject(90, 90, 280, 230);

  // -------------------------------------------------------
  // CREATE DESK
  // -------------------------------------------------------

  const desk = new Desk(390, 380, 360, 24, 150);

  // -------------------------------------------------------
  // ADD OBJECTS TO SCENE
  // -------------------------------------------------------

  scene.addObject(windowObject);

  scene.addObject(desk);
}

start();
