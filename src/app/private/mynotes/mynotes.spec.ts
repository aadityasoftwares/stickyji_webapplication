import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Mynotes } from './mynotes';

describe('Mynotes', () => {
  let component: Mynotes;
  let fixture: ComponentFixture<Mynotes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mynotes],
    }).compileComponents();

    fixture = TestBed.createComponent(Mynotes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
