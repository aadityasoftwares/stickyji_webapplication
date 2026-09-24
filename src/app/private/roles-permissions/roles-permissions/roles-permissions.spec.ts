import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RolesPermissions } from './roles-permissions';

describe('RolesPermissions', () => {
  let component: RolesPermissions;
  let fixture: ComponentFixture<RolesPermissions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolesPermissions],
    }).compileComponents();

    fixture = TestBed.createComponent(RolesPermissions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
