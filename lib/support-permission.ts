export const initialSupportPersonPermission = false;

export type SupportPermissionAction =
  | { type: "SCHEDULING_CONSENT_GIVEN" }
  | { type: "PATIENT_EXPLICITLY_SET"; authorized: boolean }
  | { type: "SCHEDULING_CONSENT_REFUSED_OR_REVOKED" };

export function updateSupportPersonPermission(
  current: boolean,
  action: SupportPermissionAction,
) {
  if (action.type === "PATIENT_EXPLICITLY_SET") return action.authorized;
  if (action.type === "SCHEDULING_CONSENT_REFUSED_OR_REVOKED") return false;
  return current;
}

