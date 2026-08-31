import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Workspacefolders } from './workspacefolders';

describe('Workspacefolders', () => {
  let component: Workspacefolders;
  let fixture: ComponentFixture<Workspacefolders>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Workspacefolders],
    }).compileComponents();

    fixture = TestBed.createComponent(Workspacefolders);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
