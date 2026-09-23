// Stub for @resvg/resvg-js used only in the portable bundle.
// Resvg = null causes renderPng to throw a clear error and renderScene to reject
// PNG format requests with exit code 1. SVG and PDF are unaffected.
export const Resvg = null;
