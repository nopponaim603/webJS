import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { camera, scene } from '../engine/view.js';

const frustum = new THREE.Frustum();
const _view = new THREE.Matrix4();
const _ball = new THREE.Sphere();

// What the camera could see, from where it stood when the field was last stepped
// — it is moved after, so this is a frame behind. The margin in the config pays
// for that, and for the shadow an animal just off the edge still throws into the
// frame.
export function survey() {
  camera.updateMatrixWorld();
  frustum.setFromProjectionMatrix(
    _view.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
}

// Whether anybody can see this bug: answered once a frame, and read by everything
// that would otherwise pose, dress or place a body for nobody.
//
// A bug out of frame is taken out of the scene rather than just hidden. Hiding
// one still leaves the renderer walking it and every bone under it looking for a
// matrix to update, and at two thousand bugs that walk is most of the frame.
export function mark(bug) {
  const S = CFG.bugAnim.offscreen;
  _ball.center.set(bug.pos.x, bug.alt || 0, bug.pos.z);
  _ball.radius = S.margin + (bug.model.parts.span || 1) * S.span;
  const seen = frustum.intersectsSphere(_ball);
  if (seen !== bug.shown) {
    if (seen) scene.add(bug.model.object);
    else scene.remove(bug.model.object);
    bug.shown = seen;
  }
  return seen;
}
