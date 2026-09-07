import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StickyNotePin } from './sticky-note-pin';

describe('StickyNotePin', () => {
  let component: StickyNotePin;
  let fixture: ComponentFixture<StickyNotePin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StickyNotePin],
    }).compileComponents();

    fixture = TestBed.createComponent(StickyNotePin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
