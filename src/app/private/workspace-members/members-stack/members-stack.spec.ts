import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MembersStack } from './members-stack';

describe('MembersStack', () => {
  let component: MembersStack;
  let fixture: ComponentFixture<MembersStack>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembersStack],
    }).compileComponents();

    fixture = TestBed.createComponent(MembersStack);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
