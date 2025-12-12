import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-comp1',
  imports: [RouterOutlet, NgIf],
  templateUrl: './comp1.component.html',
  styleUrl: './comp1.component.css',
})
export class Comp1Component {
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
