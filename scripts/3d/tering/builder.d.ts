export interface TeringLabels {
  nogl: string;
  fail: string;
  hintPlace: string;
  hintTurn: string;
  tray: string;
  left: string;
  done: string;
  /** `{n}` — plitkalar soni, `{area}` — maydon */
  count: string;
  mm: string;
  locale: string;
}

export interface TeringHandle {
  show(on: boolean): void;
  dispose(): void;
}

export function mount(
  root: HTMLElement,
  opts: { glb: string; hole: [number, number, number] | null; hint?: HTMLElement | null; labels?: Partial<TeringLabels> },
): TeringHandle;
