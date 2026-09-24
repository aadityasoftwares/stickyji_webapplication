import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcceptWorkspaceInvitation } from './accept-workspace-invitation';

describe('AcceptWorkspaceInvitation', () => {
  let component: AcceptWorkspaceInvitation;
  let fixture: ComponentFixture<AcceptWorkspaceInvitation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcceptWorkspaceInvitation],
    }).compileComponents();

    fixture = TestBed.createComponent(AcceptWorkspaceInvitation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
