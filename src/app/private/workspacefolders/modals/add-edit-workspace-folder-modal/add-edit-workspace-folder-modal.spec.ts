import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddEditWorkspaceFolderModal } from './add-edit-workspace-folder-modal';

describe('AddEditWorkspaceFolderModal', () => {
  let component: AddEditWorkspaceFolderModal;
  let fixture: ComponentFixture<AddEditWorkspaceFolderModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditWorkspaceFolderModal],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditWorkspaceFolderModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
