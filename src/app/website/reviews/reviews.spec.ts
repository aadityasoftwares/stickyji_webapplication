import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Reviews } from './reviews';

describe('Reviews', () => {
  let component: Reviews;
  let fixture: ComponentFixture<Reviews>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reviews],
    }).compileComponents();

    fixture = TestBed.createComponent(Reviews);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('selects a story and updates the featured panel from a person tab', () => {
    fixture.nativeElement.querySelector('#review-tab-sara-creator').click();
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('[role="tabpanel"]');
    expect(panel.getAttribute('aria-labelledby')).toBe('review-tab-sara-creator');
    expect(panel.querySelector('h3').textContent).toContain('My rough ideas');
    expect(fixture.nativeElement.querySelector('.review-controls').textContent).toContain('3 / 6');
  });

  it('wraps the previous control and advances with the footer action', () => {
    const stories = vi.spyOn(component.storiesClick, 'emit');
    fixture.nativeElement.querySelector('[aria-label="Previous review"]').click();
    fixture.detectChanges();
    expect(component.activeReview.name).toBe('Dev Patel');
    fixture.nativeElement.querySelector('.next-story-button').click();
    fixture.detectChanges();
    expect(component.activeReview.name).toBe('Nina Kapoor');
    expect(stories).toHaveBeenCalledOnce();
  });

  it('moves keyboard focus between story tabs and opens a side quote', () => {
    const firstTab = fixture.nativeElement.querySelector('[role="tab"]') as HTMLButtonElement;
    firstTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(component.activeReview.name).toBe('Arjun Mehta');
    expect(document.activeElement?.id).toBe('review-tab-arjun-professional');
    fixture.nativeElement.querySelector('.margin-review').click();
    fixture.detectChanges();
    expect(component.activeReview.name).toBe('Sara Kim');
  });

  it('handles a single supplied story without duplicate side cards or navigation', () => {
    fixture.componentRef.setInput('reviews', [component.reviews[2]]);
    fixture.detectChanges();
    expect(component.activeReview.name).toBe('Sara Kim');
    expect(fixture.nativeElement.querySelectorAll('.margin-review').length).toBe(0);
    expect(fixture.nativeElement.querySelector('[aria-label="Next review"]').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.next-story-button').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.community-proof').textContent).toContain(
      'Every note has a story behind it.',
    );
  });
});
