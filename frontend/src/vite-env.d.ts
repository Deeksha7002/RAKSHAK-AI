/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.css';

declare module 'react' {
  export type ReactNode = any;
  export type FC<P = {}> = (props: P) => any;
  export class Component<P = {}, S = {}> {
    props: P;
    state: S;
    setState(state: Partial<S> | ((prevState: S) => Partial<S>)): void;
    render(): any;
  }
  export const StrictMode: any;
  export type ErrorInfo = any;
  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export function useRef<T>(initialValue: T): { current: T };
  export function useMemo<T>(factory: () => T, deps: readonly any[] | undefined): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly any[]): T;
  export type FormEvent<T = Element> = any;
  export type ChangeEvent<T = Element> = any;
  export type MouseEvent<T = Element> = any;
  export namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    interface Element extends any {}
  }
  const React: any;
  export default React;
}

declare module 'react-dom/client' {
  export function createRoot(container: any): {
    render(element: any): void;
    unmount(): void;
  };
}

declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: any) => void;
    onRegisterError?: (error: any) => void;
  }
  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
  export namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    interface Element extends any {}
  }
}

declare module 'lucide-react' {
  export const Shield: any;
  export const Lock: any;
  export const CheckCircle: any;
  export const CheckCircle2: any;
  export const AlertTriangle: any;
  export const AlertCircle: any;
  export const ShieldAlert: any;
  export const ShieldCheck: any;
  export const Phone: any;
  export const PhoneCall: any;
  export const MessageSquare: any;
  export const HelpCircle: any;
  export const Volume2: any;
  export const VolumeX: any;
  export const LogOut: any;
  export const ChevronLeft: any;
  export const ChevronRight: any;
  export const FileText: any;
  export const Settings: any;
  export const Moon: any;
  export const Sun: any;
  export const Globe: any;
  export const Mic: any;
  export const Search: any;
  export const Send: any;
  export const Radio: any;
  export const Key: any;
  export const QrCode: any;
  export const Activity: any;
  export const Check: any;
  export const CheckCheck: any;
  export const Copy: any;
  export const Users: any;
  export const UserPlus: any;
  export const Info: any;
  export const ArrowRight: any;
  export const ArrowLeft: any;
  export const Download: any;
  export const Trash2: any;
  export const RefreshCw: any;
  export const CreditCard: any;
  export const Smartphone: any;
  export const Upload: any;
  export const Image: any;
  export const XCircle: any;
  const icons: { [key: string]: any };
  export default icons;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    interface Element extends any {}
  }
}
