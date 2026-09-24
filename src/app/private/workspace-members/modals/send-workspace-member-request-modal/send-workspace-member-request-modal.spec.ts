import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SendWorkspaceMemberRequestModal } from './send-workspace-member-request-modal';

describe('SendWorkspaceMemberRequestModal', () => {
  let component: SendWorkspaceMemberRequestModal;
  let fixture: ComponentFixture<SendWorkspaceMemberRequestModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendWorkspaceMemberRequestModal],
    }).compileComponents();

    fixture = TestBed.createComponent(SendWorkspaceMemberRequestModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
