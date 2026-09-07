import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StickyNote } from './sticky-note';

describe('StickyNote', () => {
  let component: StickyNote;
  let fixture: ComponentFixture<StickyNote>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StickyNote],
    }).compileComponents();

    fixture = TestBed.createComponent(StickyNote);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
