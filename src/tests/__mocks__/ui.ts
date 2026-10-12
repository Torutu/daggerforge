/**
 * Minimal stub for the UI runtime ('react', 'react/jsx-runtime',
 * 'react-dom/client').
 *
 * The plugin bundles Preact through its React-compatible API, and Preact 11
 * is ESM-only, which Jest's CommonJS runtime cannot load. No test renders UI;
 * the modules only get imported transitively (utils/index -> Sidebar -> the
 * feature views), so inert stand-ins are enough.
 */

const noop = (): void => {};

export const Fragment = noop;
export const jsx = noop;
export const jsxs = noop;
export const createRoot = () => ({ render: noop, unmount: noop });
export const useCallback = noop;
export const useEffect = noop;
export const useMemo = noop;
export const useRef = noop;
export const useState = noop;

export default { Fragment, useCallback, useEffect, useMemo, useRef, useState };
