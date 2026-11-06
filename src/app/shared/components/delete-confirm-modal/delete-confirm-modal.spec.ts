import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { DeleteConfirmModal } from './delete-confirm-modal';
import * as menuFunction from '../../functions/menu.function';

describe('DeleteConfirmModal', () => {
  let component: DeleteConfirmModal;
  let fixture: ComponentFixture<DeleteConfirmModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteConfirmModal],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteConfirmModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call closeAllMatMenus when opened', () => {
    const spy = vi.spyOn(menuFunction, 'closeAllMatMenus');
    component.open = true;
    component.ngOnChanges({
      open: new SimpleChange(false, true, true),
    });
    expect(spy).toHaveBeenCalled();
  });
});
