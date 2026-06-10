type Listener = () => void;
let listeners: Listener[] = [];

export function onOpenAdminPanel(fn: Listener) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export function emitOpenAdminPanel() {
  listeners.forEach((fn) => fn());
}
