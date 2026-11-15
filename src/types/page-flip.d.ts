declare module 'page-flip/dist/js/page-flip.module.js' {
  export class PageFlip {
    constructor(el: HTMLElement, settings: Record<string, unknown>);
    loadFromHTML(items: HTMLElement[]): void;
    flipNext(corner?: 'top' | 'bottom'): void;
    flipPrev(corner?: 'top' | 'bottom'): void;
    flip(page: number, corner?: 'top' | 'bottom'): void;
    turnToPage(page: number): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    on(event: 'flip' | 'init' | 'changeState' | 'changeOrientation', cb: (e: { data: unknown }) => void): PageFlip;
    destroy(): void;
  }
}
