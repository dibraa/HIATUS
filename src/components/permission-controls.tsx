"use client";
import { createContext, useContext, type ComponentType, type ReactNode } from "react";
const Permissions = createContext<string[] | null>(null);
export function PermissionProvider({ permissions, children }: { permissions: string[]; children: ReactNode }) { return <Permissions.Provider value={permissions}>{children}</Permissions.Provider>; }
export function usePermissions() { const permissions = useContext(Permissions); return { can: (key: string) => permissions === null || key.split("|").some(option => permissions.includes(option)) }; }
export function Permission({ name, children }: { name: string; children: ReactNode }) { const { can } = usePermissions(); return can(name) ? children : null; }
export function withPermission<P extends object>(key: string, Component: ComponentType<P>, readOnly = false) {
  function Protected(props: P) {
    const { can } = usePermissions();
    if (readOnly) return <fieldset disabled={!can(key)} className="min-w-0"><Component {...props} /></fieldset>;
    return can(key) ? <Component {...props} /> : null;
  }
  return Protected;
}
