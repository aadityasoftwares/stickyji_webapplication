import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WebsiteHeader } from './website-header';

describe('WebsiteHeader', () => {
  let component: WebsiteHeader;
  let fixture: ComponentFixture<WebsiteHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebsiteHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(WebsiteHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
