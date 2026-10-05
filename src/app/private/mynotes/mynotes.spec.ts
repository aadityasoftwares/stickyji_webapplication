import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyNotes } from './mynotes';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

describe('MyNotes', () => {
  let component: MyNotes;
  let fixture: ComponentFixture<MyNotes>;

  beforeEach(async () => {
    vi.spyOn(MyNotes.prototype, 'ngOnInit').mockImplementation(() => {});
    await TestBed.configureTestingModule({
      imports: [MyNotes],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MyNotes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('dismisses the overdue banner without opening a drawer or changing notes', async () => {
    component.overdue.data.set({ today: '2026-10-05', total: 3, byColumn: [], notes: [] });
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('3 overdue notes');
    element.querySelector<HTMLButtonElement>('button[aria-label="Dismiss overdue banner"]')?.click();
    await fixture.whenStable();
    expect(element.querySelector('app-overdue-topbar')).toBeNull();
    expect(component.overdue.open()).toBe(false);
  });

  it('opens review and closes only the side panel, leaving the banner visible', async () => {
    component.overdue.data.set({ today: '2026-10-05', total: 3, byColumn: [], notes: [] });
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const review = [...element.querySelectorAll<HTMLButtonElement>('app-overdue-topbar button')]
      .find(button => button.textContent?.includes('Review overdue'));
    review?.click();
    await fixture.whenStable();
    expect(element.querySelector('app-overdue-notes-panel [role="dialog"]')).toBeTruthy();
    element.querySelector<HTMLButtonElement>('button[aria-label="Close side panel"]')?.click();
    await fixture.whenStable();
    expect(component.overdue.open()).toBe(false);
    expect(element.querySelector('app-overdue-topbar')).toBeTruthy();
  });

  it('delegates successful bulk refresh to the existing folder loader', () => {
    const bring = vi.spyOn(component.overdue, 'bringToToday').mockImplementation((_ids, refresh) => refresh());
    const load = vi.spyOn(component, 'loadSelectedFolder').mockImplementation(() => {});
    component.bringOverdueToToday(['note']);
    expect(bring).toHaveBeenCalledOnce();
    expect(load).toHaveBeenCalledOnce();
  });
});
