import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddEditMyNotesModal } from './add-edit-my-notes-modal';

describe('AddEditMyNotesModal', () => {
  let component: AddEditMyNotesModal;
  let fixture: ComponentFixture<AddEditMyNotesModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditMyNotesModal],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditMyNotesModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
