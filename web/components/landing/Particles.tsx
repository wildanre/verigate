'use client';

import { useEffect, useRef } from 'react';
import { Renderer, Camera, Geometry, Program, Mesh } from 'ogl';

const VERT = `
attribute vec3 position;
attribute vec4 random;
attribute vec3 color;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;
uniform float uSpread;
uniform float uBaseSize;
uniform float uSizeRandomness;
varying vec4 vRandom;
varying vec3 vColor;
void main() {
  vRandom = random;
  vColor = color;
  vec3 pos = position * uSpread;
  pos.z *= 10.0;
  vec4 mPos = modelMatrix * vec4(pos, 1.0);
  float t = uTime;
  mPos.x += sin(t * random.z + 6.2831 * random.w) * mix(0.1, 1.4, random.x);
  mPos.y += sin(t * random.y + 6.2831 * random.x) * mix(0.1, 1.4, random.w);
  mPos.z += sin(t * random.w + 6.2831 * random.y) * mix(0.1, 1.4, random.z);
  vec4 mvPos = viewMatrix * mPos;
  gl_PointSize = (uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5))) / length(mvPos.xyz);
  gl_Position = projectionMatrix * mvPos;
}`;

const FRAG = `
precision highp float;
uniform float uAlphaParticles;
varying vec4 vRandom;
varying vec3 vColor;
void main() {
  vec2 uv = gl_PointCoord.xy;
  float d = length(uv - vec2(0.5));
  if (uAlphaParticles < 0.5) {
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor, 1.0);
  } else {
    float circle = smoothstep(0.5, 0.35, d) * 0.7;
    gl_FragColor = vec4(vColor, circle);
  }
}`;

function hexToRgb(hex: string): [number, number, number] {
  const int = parseInt(hex.replace('#', ''), 16);
  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255];
}

/**
 * Subtle, monochrome WebGL particle field (OGL). Mostly neutral greys/white
 * with a sparse green accent — no gradient. Respects reduced-motion and cleans
 * up its GL context on unmount.
 */
export function Particles({ count = 190 }: { count?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new Renderer({ depth: false, alpha: true });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas);

    const camera = new Camera(gl, { fov: 15 });
    camera.position.set(0, 0, 20);

    const resize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
    };
    window.addEventListener('resize', resize);
    resize();

    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count * 4);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      let x: number, y: number, z: number, len: number;
      do {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        z = Math.random() * 2 - 1;
        len = x * x + y * y + z * z;
      } while (len > 1 || len === 0);
      const r = Math.cbrt(Math.random());
      positions.set([x * r, y * r, z * r], i * 3);
      randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
      const pick = Math.random();
      const hex = pick < 0.12 ? '#4ade80' : pick < 0.55 ? '#8b93a7' : '#e6e9ef';
      colors.set(hexToRgb(hex), i * 3);
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: positions },
      random: { size: 4, data: randoms },
      color: { size: 3, data: colors },
    });
    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uSpread: { value: 9 },
        uBaseSize: { value: 78 },
        uSizeRandomness: { value: 1 },
        uAlphaParticles: { value: 1 },
      },
      transparent: true,
      depthTest: false,
    });
    const particles = new Mesh(gl, { mode: gl.POINTS, geometry, program });

    let raf = 0;
    let last = performance.now();
    let elapsed = 0;

    if (reduced) {
      program.uniforms.uTime.value = 1.2;
      particles.rotation.y = 0.3;
      renderer.render({ scene: particles, camera });
    } else {
      const update = (t: number) => {
        raf = requestAnimationFrame(update);
        elapsed += (t - last) * 0.0006;
        last = t;
        program.uniforms.uTime.value = elapsed;
        particles.rotation.y = elapsed * 0.04;
        particles.rotation.x = Math.sin(elapsed * 0.02) * 0.1;
        renderer.render({ scene: particles, camera });
      };
      raf = requestAnimationFrame(update);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      if (gl.canvas.parentNode) gl.canvas.parentNode.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [count]);

  return <div ref={ref} className="particles" aria-hidden />;
}
