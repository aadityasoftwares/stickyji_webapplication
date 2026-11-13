import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Hero } from './hero';

describe('Hero', () => {
  let component: Hero;
  let fixture: ComponentFixture<Hero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hero],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Hero);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the hero headline and notes preview', () => {
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('h1#hero-title')?.textContent).toContain('sticky notes');
    expect(root.querySelector('.hero-description')?.textContent).toContain('Sticky Ji');
    expect(root.querySelectorAll('.hero-plan-note').length).toBe(3);
  });

  it('emits startFree when create account action is triggered', () => {
    const startFreeSpy = vi.spyOn(component.startFree, 'emit');
    component.onCreateAccountAction();
    expect(startFreeSpy).toHaveBeenCalled();
  });
});
