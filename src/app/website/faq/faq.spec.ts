import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Faq } from './faq';

describe('Faq', () => {
  let component: Faq;
  let fixture: ComponentFixture<Faq>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Faq],
    }).compileComponents();

    fixture = TestBed.createComponent(Faq);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders one expandable note per question', () => {
    const notes = fixture.nativeElement.querySelectorAll('details.faq-note');
    expect(notes.length).toBe(component.items.length);
    expect(notes[0].querySelector('.question-text').textContent).toContain('What is Sticky Ji?');
  });
});
