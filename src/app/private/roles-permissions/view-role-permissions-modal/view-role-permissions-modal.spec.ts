import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewRolePermissionsModal } from './view-role-permissions-modal';

describe('ViewRolePermissionsModal', () => {
  let component: ViewRolePermissionsModal;
  let fixture: ComponentFixture<ViewRolePermissionsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewRolePermissionsModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewRolePermissionsModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
