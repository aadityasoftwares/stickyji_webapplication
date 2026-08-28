import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Collaboration } from './collaboration';

describe('Collaboration', () => {
  let component: Collaboration;
  let fixture: ComponentFixture<Collaboration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Collaboration],
    }).compileComponents();

    fixture = TestBed.createComponent(Collaboration);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
