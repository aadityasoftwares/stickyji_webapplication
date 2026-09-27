import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddEditWorkspaceFolderSidePanel } from './add-edit-workspace-folder-side-panel';

describe('AddEditWorkspaceFolderSidePanel', () => {
  let component: AddEditWorkspaceFolderSidePanel;
  let fixture: ComponentFixture<AddEditWorkspaceFolderSidePanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditWorkspaceFolderSidePanel],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditWorkspaceFolderSidePanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
