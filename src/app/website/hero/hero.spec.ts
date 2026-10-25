import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Hero } from './hero';

describe('Hero', () => {
  let component: Hero;
  let fixture: ComponentFixture<Hero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hero],
    }).compileComponents();

    fixture = TestBed.createComponent(Hero);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('switches between app views while retaining the same notes', async () => {
    const root: HTMLElement = fixture.nativeElement;
    const buttons = root.querySelectorAll<HTMLButtonElement>('.preview-tabs button');
    expect(root.querySelectorAll('.preview-notes-grid .preview-note').length).toBe(2);
    expect(root.querySelector('.preview-empty')?.textContent).toContain('No completed notes yet');

    buttons[1].click();
    await fixture.whenStable();
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    expect(root.querySelectorAll('.preview-kanban .preview-panel').length).toBe(3);
    expect(root.querySelectorAll('.preview-kanban .preview-note').length).toBe(2);

    buttons[2].click();
    await fixture.whenStable();
    expect(root.querySelectorAll('tbody tr').length).toBe(2);
    expect(root.querySelector('.preview-table-view')?.textContent).toContain('Home Page Corrections');

    buttons[0].click();
    await fixture.whenStable();
    expect(root.querySelectorAll('.preview-notes-grid .preview-note').length).toBe(2);
  });

  it('keeps search results consistent across views and handles no matches', async () => {
    const root: HTMLElement = fixture.nativeElement;
    const search = root.querySelector<HTMLInputElement>('input[type="search"]')!;
    search.value = 'ST-000002';
    search.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(root.querySelectorAll('.preview-note').length).toBe(1);
    expect(root.querySelector('.preview-note')?.textContent).toContain('7 of 12 complete');

    root.querySelectorAll<HTMLButtonElement>('.preview-tabs button')[2].click();
    await fixture.whenStable();
    expect(root.querySelectorAll('tbody tr').length).toBe(1);

    search.value = 'no match';
    search.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(root.querySelectorAll('tbody tr').length).toBe(0);
    expect(root.querySelector('.preview-no-results')?.textContent).toContain('No matching notes');
  });
});
