import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddEditWorkspaceSidePanel } from './add-edit-workspace-side-panel';

describe('AddEditWorkspaceSidePanel', () => {
  let component: AddEditWorkspaceSidePanel;
  let fixture: ComponentFixture<AddEditWorkspaceSidePanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditWorkspaceSidePanel],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditWorkspaceSidePanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
