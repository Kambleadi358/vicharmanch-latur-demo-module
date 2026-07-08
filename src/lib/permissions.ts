// Centralized Permission Manager
// Reusable across web & future Android/Capacitor build.
// Permissions are requested only when actually needed by a feature.

export type PermissionKind = "camera" | "microphone" | "notifications";
export type PermState = "granted" | "denied" | "prompt" | "unsupported";

interface Info { supported: boolean; state: PermState; }

async function queryNavigatorPermission(name: PermissionName): Promise<PermState> {
  try {
    if (!("permissions" in navigator)) return "prompt";
    // @ts-ignore – some names are experimental
    const p = await navigator.permissions.query({ name });
    return p.state as PermState;
  } catch {
    return "prompt";
  }
}

export async function getPermissionStatus(kind: PermissionKind): Promise<Info> {
  switch (kind) {
    case "camera": {
      if (!navigator.mediaDevices?.getUserMedia) return { supported: false, state: "unsupported" };
      return { supported: true, state: await queryNavigatorPermission("camera" as PermissionName) };
    }
    case "microphone": {
      if (!navigator.mediaDevices?.getUserMedia) return { supported: false, state: "unsupported" };
      return { supported: true, state: await queryNavigatorPermission("microphone" as PermissionName) };
    }
    case "notifications": {
      if (!("Notification" in window)) return { supported: false, state: "unsupported" };
      const s = Notification.permission;
      return {
        supported: true,
        state: s === "default" ? "prompt" : (s as PermState),
      };
    }
  }
}

export async function requestPermission(kind: PermissionKind): Promise<PermState> {
  try {
    if (kind === "camera") {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      return "granted";
    }
    if (kind === "microphone") {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return "granted";
    }
    if (kind === "notifications") {
      if (!("Notification" in window)) return "unsupported";
      const r = await Notification.requestPermission();
      return r === "default" ? "prompt" : (r as PermState);
    }
    return "prompt";
  } catch {
    return "denied";
  }
}

export async function getAllPermissions(): Promise<Record<PermissionKind, Info>> {
  const [camera, microphone, notifications] = await Promise.all([
    getPermissionStatus("camera"),
    getPermissionStatus("microphone"),
    getPermissionStatus("notifications"),
  ]);
  return { camera, microphone, notifications };
}

export const PERMISSION_LABELS_MR: Record<PermissionKind, string> = {
  camera: "कॅमेरा",
  microphone: "मायक्रोफोन",
  notifications: "सूचना",
};
