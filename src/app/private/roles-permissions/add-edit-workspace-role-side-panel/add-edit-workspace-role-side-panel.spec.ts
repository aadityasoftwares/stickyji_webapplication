import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddEditWorkspaceRoleSidePanel } from './add-edit-workspace-role-side-panel';

describe('AddEditWorkspaceRoleSidePanel', () => {
  let component: AddEditWorkspaceRoleSidePanel;
  let fixture: ComponentFixture<AddEditWorkspaceRoleSidePanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditWorkspaceRoleSidePanel],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditWorkspaceRoleSidePanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
