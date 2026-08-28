import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThoughtFlow } from './thought-flow';

describe('ThoughtFlow', () => {
  let component: ThoughtFlow;
  let fixture: ComponentFixture<ThoughtFlow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThoughtFlow],
    }).compileComponents();

    fixture = TestBed.createComponent(ThoughtFlow);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
