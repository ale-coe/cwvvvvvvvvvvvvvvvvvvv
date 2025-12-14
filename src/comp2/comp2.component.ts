import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-comp2',
  imports: [],
  templateUrl: './comp2.component.html',
  styleUrl: './comp2.component.css',
})
export class Comp2Component implements OnInit {
  ngOnInit(): void {
    console.log('init comp2');
  }

  title = 'web-vitals-test';

  test() {
    for (let i = 0; i < 2000; i++) {
      console.log(1);
    }

    console.log(15);
  }
}
