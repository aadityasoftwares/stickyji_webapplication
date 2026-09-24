import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddEditNoteSidePanel } from './add-edit-note-side-panel';

describe('AddEditNoteSidePanel', () => {
  let component: AddEditNoteSidePanel;
  let fixture: ComponentFixture<AddEditNoteSidePanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditNoteSidePanel],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditNoteSidePanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
