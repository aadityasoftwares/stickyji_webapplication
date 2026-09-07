import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddEditWorkspaceModal } from './add-edit-workspace-modal';

describe('AddEditWorkspaceModal', () => {
  let component: AddEditWorkspaceModal;
  let fixture: ComponentFixture<AddEditWorkspaceModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditWorkspaceModal],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditWorkspaceModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
