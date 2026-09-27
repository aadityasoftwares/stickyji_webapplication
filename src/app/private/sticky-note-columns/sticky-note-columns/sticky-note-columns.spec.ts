import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StickyNoteColumns } from './sticky-note-columns';

describe('StickyNoteColumns', () => {
  let component: StickyNoteColumns;
  let fixture: ComponentFixture<StickyNoteColumns>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StickyNoteColumns],
    }).compileComponents();

    fixture = TestBed.createComponent(StickyNoteColumns);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
