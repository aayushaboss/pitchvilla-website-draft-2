// Small runtime helpers used by the components generated from design-source/*.dc.html.
// They reproduce how the design runtime (design-source/support.js) renders values.
import React from 'react';

/** Base class for the design files' logic classes (state, setState, lifecycle). */
export class DCLogic extends React.Component {
  renderVals() {
    return {};
  }
}

/** Inline style: CSS text or a style object -> React style object. */
export function S(css) {
  if (css == null || typeof css === 'object') return css ?? undefined;
  const o = {};
  for (const decl of String(css).split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    o[prop.startsWith('--') ? prop : prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = decl.slice(i + 1).trim();
  }
  return o;
}

/** Text interpolation: hide null/undefined/booleans, pass elements through, stringify the rest. */
export function T(v) {
  if (v == null || typeof v === 'boolean') return null;
  if (React.isValidElement(v) || Array.isArray(v)) return v;
  return String(v);
}

/** <sc-for> list: anything that is not an array renders nothing. */
export function A(list) {
  return Array.isArray(list) ? list : [];
}
