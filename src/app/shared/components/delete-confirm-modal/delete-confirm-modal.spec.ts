import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { DeleteConfirmModal } from './delete-confirm-modal';

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

  it('should close active menus when opened', () => {
    const fakeBackdrop = document.createElement('div');
    fakeBackdrop.className = 'cdk-overlay-backdrop';
    const clickSpy = vi.spyOn(fakeBackdrop, 'click');
    document.body.appendChild(fakeBackdrop);

    try {
      component.open = true;
      component.ngOnChanges({
        open: new SimpleChange(false, true, true),
      });
      expect(clickSpy).toHaveBeenCalled();
    } finally {
      fakeBackdrop.remove();
    }
  });

  it('should emit closed when close is called and not busy', () => {
    const spy = vi.spyOn(component.closed, 'emit');
    component.busy = false;
    component.close();
    expect(spy).toHaveBeenCalled();
  });

  it('should not emit closed when busy is true', () => {
    const spy = vi.spyOn(component.closed, 'emit');
    component.busy = true;
    component.close();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit confirmed when confirm is called and not busy', () => {
    const spy = vi.spyOn(component.confirmed, 'emit');
    component.busy = false;
    component.confirm();
    expect(spy).toHaveBeenCalled();
  });

  it('should not emit confirmed when busy is true', () => {
    const spy = vi.spyOn(component.confirmed, 'emit');
    component.busy = true;
    component.confirm();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should resolve correct tone, variant, and eyebrow for permanent vs trash modes', () => {
    component.mode = 'permanent';
    expect(component.resolvedTone).toBe('red');
    expect(component.confirmVariant).toBe('danger');
    expect(component.resolvedEyebrow).toBe('Permanent action');

    component.mode = 'trash';
    expect(component.resolvedTone).toBe('yellow');
    expect(component.confirmVariant).toBe('noteYellow');
    expect(component.resolvedEyebrow).toBe('Safe delete');
  });
});
