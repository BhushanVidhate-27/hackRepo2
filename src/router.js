const routes = new Map();

export function defineRoutes(routeTable) {
  routes.clear();
  for (const [path, handler] of Object.entries(routeTable)) {
    routes.set(normalize(path), handler);
  }
}

function normalize(path) {
  if (!path) return "/";
  if (!path.startsWith("/")) path = `/${path}`;
  return path === "" ? "/" : path;
}

export function getRoutePathFromHash() {
  const hash = window.location.hash || "#/";
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return path.split("?")[0].split("#")[0] || "/";
}

export function navigate(to) {
  const path = normalize(to);
  if (`#${path}` === window.location.hash) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  window.location.hash = path;
}

export async function startRouter(renderFn) {
  async function onRoute() {
    const path = getRoutePathFromHash();
    const handler = routes.get(path) || routes.get("*");
    await renderFn({ path, handler });
  }
  window.addEventListener("hashchange", onRoute);
  await onRoute();
}

