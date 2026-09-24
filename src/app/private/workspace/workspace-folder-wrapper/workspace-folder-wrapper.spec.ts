import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkspaceFolderWrapper } from './workspace-folder-wrapper';

describe('WorkspaceFolderWrapper', () => {
  let component: WorkspaceFolderWrapper;
  let fixture: ComponentFixture<WorkspaceFolderWrapper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceFolderWrapper],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkspaceFolderWrapper);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
