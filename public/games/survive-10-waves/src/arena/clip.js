import * as THREE from 'three';

const cutRadius = { value: 0 };

export function setCut(r) { cutRadius.value = r; }

export function clip(material) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.cutRadius = cutRadius;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCut;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        #ifdef USE_INSTANCING
          vCut = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
        #else
          vCut = (modelMatrix * vec4(transformed, 1.0)).xyz;
        #endif`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float cutRadius;\nvarying vec3 vCut;')
      .replace('#include <clipping_planes_fragment>',
               '#include <clipping_planes_fragment>\nif (length(vCut.xz) > cutRadius) discard;');
  };
  material.customProgramCacheKey = () => 'arena-cut';
  return material;
}

export function clipShadow(mesh) {
  mesh.customDepthMaterial = clip(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }));
}
