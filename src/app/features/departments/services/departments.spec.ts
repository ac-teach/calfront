import { TestBed } from '@angular/core/testing';
import { Departments } from './departments';

describe('Departments', () => {
  let service: Departments;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Departments);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
