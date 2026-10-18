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

  it('shows two folder previews and summarizes the remainder', () => {
    component.folderCount = 3;
    component.folders = [
      { id: 'one', name: 'My Notes' },
      { id: 'two', name: 'Testing' },
      { id: 'three', name: 'Product additions' },
    ];

    expect(component.visibleFolderPreviews.map((folder) => folder.name)).toEqual([
      'My Notes',
      'Testing',
    ]);
    expect(component.remainingFolderCount).toBe(1);
    expect(component.resolvedCountTooltip).toBe('3 folders: My Notes, Testing, Product additions');
  });
});
