import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyzingComponent } from './analyzing.component';

describe('AnalyzingComponent', () => {
  let component: AnalyzingComponent;
  let fixture: ComponentFixture<AnalyzingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AnalyzingComponent]
    });
    fixture = TestBed.createComponent(AnalyzingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
