import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UseCases } from './use-cases';

describe('UseCases', () => {
  let component: UseCases;
  let fixture: ComponentFixture<UseCases>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UseCases],
    }).compileComponents();

    fixture = TestBed.createComponent(UseCases);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('updates the completion count and progress when an example task is checked', () => {
    const tasks = fixture.nativeElement.querySelectorAll('input[type="checkbox"]');
    tasks[1].click();
    fixture.detectChanges();

    expect(component.completedTaskCount).toBe(2);
    expect(
      fixture.nativeElement.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'),
    ).toBe('2');
    expect(fixture.nativeElement.querySelector('.main-note-footer').textContent).toContain(
      '2 of 3 complete',
    );
  });

  it('switches the board and moves tab focus with the keyboard', () => {
    const firstTab = fixture.nativeElement.querySelector('[role="tab"]') as HTMLButtonElement;
    firstTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();

    expect(component.selectedPersonaId).toBe('professional');
    expect(fixture.nativeElement.querySelector('.board-owner').textContent).toContain(
      'Arjun Mehta',
    );
    const selectedTab = fixture.nativeElement.querySelector('[aria-selected="true"]');
    expect(selectedTab.id).toBe('persona-tab-professional');
    expect(document.activeElement).toBe(selectedTab);
  });

  it('starts with the selected persona from the workspace menu', () => {
    const start = vi.spyOn(component.startClick, 'emit');
    fixture.nativeElement.querySelector('#persona-tab-creator').click();
    fixture.detectChanges();
    const menu = fixture.nativeElement.querySelector('details') as HTMLDetailsElement;
    menu.open = true;
    menu.querySelector('button')!.click();

    expect(start).toHaveBeenCalledWith('creator');
    expect(menu.open).toBe(false);
  });
});
