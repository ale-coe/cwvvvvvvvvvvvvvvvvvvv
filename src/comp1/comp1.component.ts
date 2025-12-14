import { NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-comp1',
  imports: [NgIf],
  templateUrl: './comp1.component.html',
  styleUrl: './comp1.component.css',
})
export class Comp1Component implements OnInit {
  ngOnInit(): void {
    console.log('init comp1');
  }

  title = 'web-vitals-test';
  show = false;

  showBox() {
    setTimeout(() => {
      this.show = true;
    }, 1500);

    setTimeout(() => {
      this.show = false;
    }, 2500);
  }
}
