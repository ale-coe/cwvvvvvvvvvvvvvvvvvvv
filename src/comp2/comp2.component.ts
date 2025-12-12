import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-comp2',
  imports: [RouterOutlet],
  templateUrl: './comp2.component.html',
  styleUrl: './comp2.component.css',
})
export class Comp2Component {
  title = 'web-vitals-test';

  test() {
    for (let i = 0; i < 2000; i++) {
      console.log(1);
    }

    console.log(15);
  }
}
