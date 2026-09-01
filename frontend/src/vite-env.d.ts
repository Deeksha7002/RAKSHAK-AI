/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// Ambient fallbacks for React when node_modules is not yet locally installed
declare module 'react' {
  export type ReactNode = any;
  export type FC<P = {}> = (props: P) => any;
  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export function useRef<T>(initialValue: T): { current: T };
  export function useMemo<T>(factory: () => T, deps: readonly any[] | undefined): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly any[]): T;
  export type FormEvent<T = Element> = any;
  export type ChangeEvent<T = Element> = any;
  export type MouseEvent<T = Element> = any;
  const React: any;
  export default React;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'lucide-react' {
  export const Shield: any;
  export const Lock: any;
  export const CheckCircle: any;
  export const AlertTriangle: any;
  export const ShieldAlert: any;
  export const Phone: any;
  export const MessageSquare: any;
  export const HelpCircle: any;
  export const Volume2: any;
  export const VolumeX: any;
  export const LogOut: any;
  export const ChevronLeft: any;
  export const ChevronRight: any;
  export const AlertCircle: any;
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
  export const Copy: any;
  export const Users: any;
  export const Info: any;
  export const ArrowRight: any;
  [key: string]: any;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
