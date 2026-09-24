import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SendWorkspaceMemberRequestSidePanel } from './send-workspace-member-request-side-panel';

describe('SendWorkspaceMemberRequestSidePanel', () => {
  let component: SendWorkspaceMemberRequestSidePanel;
  let fixture: ComponentFixture<SendWorkspaceMemberRequestSidePanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendWorkspaceMemberRequestSidePanel],
    }).compileComponents();

    fixture = TestBed.createComponent(SendWorkspaceMemberRequestSidePanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
