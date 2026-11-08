import path from "node:path";

// The videos draw with the site's own pixel art (palette, sprites, scenes), so
// "@/" is the web app's root, and React resolves to this package's copy so the
// site files and Remotion share one React. Shared by the Studio config and the
// render script.
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")), "..");
const site = path.resolve(root, "..", "apps", "web");
const own = (p) => path.resolve(root, "node_modules", p);

export const override = (c) => ({
  ...c,
  resolve: {
    ...c.resolve,
    alias: { ...c.resolve?.alias, "@": site, react: own("react"), "react-dom": own("react-dom") },
  },
});
