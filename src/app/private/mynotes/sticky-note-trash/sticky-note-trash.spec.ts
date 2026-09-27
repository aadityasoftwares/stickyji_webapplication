import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StickyNoteTrash } from './sticky-note-trash';

describe('StickyNoteTrash', () => {
  let component: StickyNoteTrash;
  let fixture: ComponentFixture<StickyNoteTrash>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StickyNoteTrash],
    }).compileComponents();

    fixture = TestBed.createComponent(StickyNoteTrash);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
