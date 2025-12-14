import { Component, inject, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  NavigationStart,
  Router,
  RouterLinkWithHref,
  RouterOutlet,
} from '@angular/router';
import { CLS, createMetricFactory, INP } from './web-vitals';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLinkWithHref],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'web-vitals-test';
  route = inject(ActivatedRoute);
  router = inject(Router);

  cls!: CLS;
  inp!: INP;

  useNativeWebVitals = false;

  ngOnInit(): void {
    if (this.useNativeWebVitals) {
      (window as any).webVitals.onINP(console.log, {
        durationThreshold: 16,
        reportAllChanges: true,
      });
      (window as any).webVitals.onCLS(console.log, {
        reportAllChanges: true,
      });
    } else {
      this.router.events.subscribe({
        next: (v) => {
          if (v instanceof NavigationStart) {
            console.log('start', this.router.url);

            const resultCls = this.cls?.destroy();
            const resltInp = this.inp?.destroy();
            if (resultCls) {
              console.log(this.router.url, resultCls);
            }
            if (resltInp) {
              console.log(this.router.url, resltInp);
            }
          }

          if (v instanceof NavigationEnd) {
            console.log('end', this.router.url);
            this.cls = createMetricFactory(CLS);
            this.inp = createMetricFactory(INP);
          }
        },
      });
    }
  }
}
