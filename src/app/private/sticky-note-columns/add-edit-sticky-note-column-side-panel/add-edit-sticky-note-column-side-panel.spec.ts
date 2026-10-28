import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddEditStickyNoteColumnSidePanel } from './add-edit-sticky-note-column-side-panel';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AddEditStickyNoteColumnSidePanel', () => {
  let component: AddEditStickyNoteColumnSidePanel;
  let fixture: ComponentFixture<AddEditStickyNoteColumnSidePanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditStickyNoteColumnSidePanel],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditStickyNoteColumnSidePanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
