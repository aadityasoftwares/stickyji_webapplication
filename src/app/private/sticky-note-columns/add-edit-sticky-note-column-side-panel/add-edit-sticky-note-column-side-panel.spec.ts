import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddEditStickyNoteColumnSidePanel } from './add-edit-sticky-note-column-side-panel';

describe('AddEditStickyNoteColumnSidePanel', () => {
  let component: AddEditStickyNoteColumnSidePanel;
  let fixture: ComponentFixture<AddEditStickyNoteColumnSidePanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditStickyNoteColumnSidePanel],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditStickyNoteColumnSidePanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
