// identical helpers, just split out

// utility for sending once websocket is open
export function sendWhenOpen(ws: any, fn: () => void) {
  if (ws.readyState === ws.OPEN) {
    fn();
  } else {
    const onOpen = () => {
      ws.removeEventListener?.("open", onOpen);
      fn();
    };
    ws.addEventListener?.("open", onOpen);
  }
}

export function escapeXml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
