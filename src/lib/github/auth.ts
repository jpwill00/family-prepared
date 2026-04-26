// GitHub OAuth Device Flow — Sprint 2.
// All GitHub auth goes through this module.

export interface DeviceFlowState {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export async function startDeviceFlow(): Promise<DeviceFlowState> {
  throw new Error("GitHub sync not available until Sprint 2");
}

export async function pollForToken(
  _state: DeviceFlowState,
): Promise<string | null> {
  throw new Error("GitHub sync not available until Sprint 2");
}

export async function getStoredToken(): Promise<string | null> {
  return null;
}

export async function revokeToken(): Promise<void> {
  // no-op until Sprint 2
}
