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

  it('keeps the header and footer badges in sync when the column changes', async () => {
    component.open = true;
    component.saveState.set('saved');
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('.app-side-panel-note .app-badge-success')?.textContent,
    ).toContain('Saved');
    component.updateText('name', 'Updated column');
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('.app-side-panel-note .app-badge-warning')?.textContent,
    ).toContain('Unsaved changes');
    expect(
      fixture.nativeElement.querySelector('.column-editor-footer .app-badge-warning')?.textContent,
    ).toContain('Unsaved changes');
  });
});
