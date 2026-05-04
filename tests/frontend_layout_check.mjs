import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("frontend/index.html", "utf8");
const css = readFileSync("frontend/index.css", "utf8");
const js = readFileSync("frontend/index.js", "utf8");

assert.match(html, /id="status-toggle-button"/, "status toggle button should exist");
assert.match(html, /aria-controls="status-panel"/, "status toggle should target status panel");
assert.match(html, /id="scene-background-image"/, "scene background should use a real image element for large data URLs");
assert.doesNotMatch(html, /id="fullscreen-button"/, "fullscreen button should be removed");

assert.match(css, /#app-container\s*{[^}]*height:\s*100vh/s, "app should default to viewport height");
assert.match(css, /#app-container\s*{[^}]*max-width:\s*none/s, "app should default to full viewport width");
assert.match(css, /#game-view\.status-collapsed\s*{[^}]*grid-template-columns:\s*48px\s+1fr/s, "desktop collapsed status rail should keep the status panel on the left");
assert.match(css, /@media\s*\(max-width:\s*850px\)[\s\S]*#status-panel\s*{[^}]*position:\s*absolute/s, "mobile status panel should overlay instead of consuming layout rows");
assert.match(css, /@media\s*\(max-width:\s*850px\)[\s\S]*#game-view\.status-collapsed\s+#status-panel/s, "mobile collapsed status panel should be hidden off-canvas");
assert.match(css, /#scene-background-image\s*{[^}]*position:\s*fixed/s, "scene background image should be fixed behind the app");
assert.match(css, /#scene-background-image\s*{[^}]*pointer-events:\s*none/s, "scene background image must not block clicks or input");
assert.match(css, /#scene-background-image\s*{[^}]*z-index:\s*2/s, "scene background image should visually sit above the app");
assert.match(css, /body\.has-scene-background\s+#scene-background-image\s*{[^}]*opacity:\s*0\.2/s, "scene background should render at 0.20 opacity");
assert.match(css, /#app-container\s*{[^}]*z-index:\s*1/s, "app content should render above the scene background layer");

assert.match(js, /statusToggleButton:\s*document\.getElementById\('status-toggle-button'\)/, "status toggle should be wired in DOMElements");
assert.match(js, /function toggleStatusPanel\(\)/, "status panel toggle handler should exist");
assert.match(js, /window\.matchMedia\('\(max-width: 850px\)'\)\.matches/, "mobile should start with the status panel collapsed");
assert.match(js, /function scheduleSceneBackgroundUpdate\(\)/, "scene background update should be scheduled after DOM rendering");
assert.match(js, /function updateSceneBackground\(\)/, "scene background updater should exist");
assert.match(js, /requestAnimationFrame\(updateSceneBackground\)/, "scene background should update after a paint frame");
assert.match(js, /addEventListener\('load',\s*scheduleSceneBackgroundUpdate/, "scene background should retry after image load");
assert.match(js, /sceneBackgroundImage:\s*document\.getElementById\('scene-background-image'\)/, "scene background image should be wired in DOMElements");
assert.match(js, /DOMElements\.sceneBackgroundImage\.src\s*=\s*imageUrl/, "scene image URL should be assigned directly to an image element");
assert.doesNotMatch(js, /fullscreenButton/, "fullscreen button wiring should be removed");
