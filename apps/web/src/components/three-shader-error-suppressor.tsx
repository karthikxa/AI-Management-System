'use client';

/**
 * Client component that patches console.error at MODULE SCOPE (not in useEffect)
 * to suppress THREE.js WebGL shader compilation errors before any component
 * renders. The TSL shader compiler generates variable names with double
 * underscores (e.g. `colorA__r_6i_`) which are reserved in GLSL. These are
 * cosmetic — the shaders still render — and originate from Three.js internals.
 *
 * Because this is a 'use client' module, its top-level code runs on the
 * client side as soon as the module is imported during hydration.
 */

const THREE_SHADER_ERROR_PATTERN =
  /THREE\.WebGLProgram:[\s\S]*identifiers containing two consecutive underscores/;

const originalConsoleError = console.error;

console.error = (...args: unknown[]) => {
  const firstArg = args[0];
  if (
    typeof firstArg === 'string' &&
    THREE_SHADER_ERROR_PATTERN.test(firstArg)
  ) {
    return; // suppress — cosmetic WebGL noise from Three.js internals
  }
  originalConsoleError.apply(console, args);
};

export function ThreeShaderErrorSuppressor() {
  return null;
}
