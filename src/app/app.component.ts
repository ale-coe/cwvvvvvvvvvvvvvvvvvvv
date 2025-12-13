import { Component, inject, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLinkWithHref,
  RouterOutlet,
} from '@angular/router';

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

  ngOnInit(): void {
    // (window as any).webVitals.onINP(console.log, {
    //   durationThreshold: 16,
    //   reportAllChanges: true,
    // });
    // (window as any).webVitals.onCLS(console.log, {
    //   reportAllChanges: true,
    // });

    this.router.events.subscribe({
      next: (v) => {
        if (v instanceof NavigationEnd) {
          const resultCls = this.cls?.destroy();
          const resltInp = this.inp?.destroy();
          if (resultCls) {
            console.log(this.router.url, resultCls);
          }
          if (resltInp) {
            console.log(this.router.url, resltInp);
          }

          this.cls = createMetricFactory(CLS);
          this.inp = createMetricFactory(INP);
        }
      },
    });
  }
}

type MetricCtor<T extends Metric> = new (routeStartTime: number) => T;
const createMetricFactory = <T extends Metric>(ctr: MetricCtor<T>): T => {
  return new ctr(performance.now());
};

abstract class Metric {
  protected abstract thresholds: [number, number];
  protected abstract name: string;
  protected po: PerformanceObserver;
  protected processed = false;

  constructor(
    protected readonly routeStartTime: number,
    type: string,
    opts = {}
  ) {
    this.po = new PerformanceObserver((entries) => {
      for (const entry of entries.getEntries()) {
        this._processEntry(entry);
      }
    });
    this.po.observe({
      type,
      buffered: true,
      ...opts,
    } as any);
  }

  protected abstract _processEntry(entry: any): any;
  protected abstract getReportValue(): number;

  getRating = (value: number) => {
    if (value > this.thresholds[1]) {
      return 'poor';
    }
    if (value > this.thresholds[0]) {
      return 'needs-improvement';
    }
    return 'good';
  };

  report(value: number) {
    return { name: this.name, rating: this.getRating(value), value };
  }

  public destroy() {
    for (const entry of this.po.takeRecords()) {
      this._processEntry(entry);
    }

    this.po.disconnect();
    return this.processed ? this.report(this.getReportValue()) : null;
  }
}

class CLS extends Metric {
  protected thresholds = [0.1, 0.25] as [number, number];
  protected name = 'CLS';

  constructor(protected override readonly routeStartTime: number) {
    super(routeStartTime, 'layout-shift');
  }

  _sessionValue = 0;
  _sessionEntries: any[] = [];

  _maxValue = 0;

  _processEntry(entry: any) {
    // Only count layout shifts without recent user input.
    if (entry.hadRecentInput || entry.startTime < this.routeStartTime) return;

    this.processed = true;
    const firstSessionEntry = this._sessionEntries[0];
    const lastSessionEntry = this._sessionEntries.at(-1);

    // If the entry occurred less than 1 second after the previous entry
    // and less than 5 seconds after the first entry in the session,
    // include the entry in the current session. Otherwise, start a new
    // session.
    if (
      this._sessionValue &&
      firstSessionEntry &&
      lastSessionEntry &&
      entry.startTime - lastSessionEntry.startTime < 1000 &&
      entry.startTime - firstSessionEntry.startTime < 5000
    ) {
      this._sessionValue += entry.value;
      this._sessionEntries.push(entry);
    } else {
      this._sessionValue = entry.value;
      this._sessionEntries = [entry];
    }

    this._maxValue = Math.max(this._sessionValue, this._maxValue);
  }

  protected override getReportValue(): number {
    return this._maxValue;
  }
}

class INP extends Metric {
  thresholds = [200, 500] as [number, number];
  name = 'INP';

  MAX_INTERACTIONS_TO_CONSIDER = 10;
  prevInteractionCount = 0;

  constructor(protected override readonly routeStartTime: number) {
    super(routeStartTime, 'event', { durationThreshold: 40 });
  }

  /**
   * A list of longest interactions on the page (by latency) sorted so the
   * longest one is first. The list is at most MAX_INTERACTIONS_TO_CONSIDER
   * long.
   */
  _longestInteractionList: any[] = [];

  /**
   * A mapping of longest interactions by their interaction ID.
   * This is used for faster lookup.
   */
  _longestInteractionMap: Map<number, any> = new Map();

  /**
   * Takes a performance entry and adds it to the list of worst interactions
   * if its duration is long enough to make it among the worst. If the
   * entry is part of an existing interaction, it is merged and the latency
   * and entries list is updated as needed.
   */
  _processEntry(entry: any) {
    if (!entry.interactionId || entry.startTime < this.routeStartTime) return;

    this.processed = true;

    // The least-long of the 10 longest interactions.
    const minLongestInteraction = this._longestInteractionList.at(-1);

    let interaction = this._longestInteractionMap.get(entry.interactionId!);

    // Only process the entry if it's possibly one of the ten longest,
    // or if it's part of an existing interaction.
    if (
      interaction ||
      this._longestInteractionList.length < this.MAX_INTERACTIONS_TO_CONSIDER ||
      // If the above conditions are false, `minLongestInteraction` will be set.
      entry.duration > minLongestInteraction!._latency
    ) {
      // If the interaction already exists, update it. Otherwise create one.
      if (interaction) {
        // If the new entry has a longer duration, replace the old entries,
        // otherwise add to the array.
        if (entry.duration > interaction._latency) {
          interaction.entries = [entry];
          interaction._latency = entry.duration;
        } else if (
          entry.duration === interaction._latency &&
          entry.startTime === interaction.entries[0].startTime
        ) {
          interaction.entries.push(entry);
        }
      } else {
        interaction = {
          id: entry.interactionId!,
          entries: [entry],
          _latency: entry.duration,
        };
        this._longestInteractionMap.set(interaction.id, interaction);
        this._longestInteractionList.push(interaction);
      }

      // Sort the entries by latency (descending) and keep only the top ten.
      this._longestInteractionList.sort((a, b) => b._latency - a._latency);
      if (
        this._longestInteractionList.length > this.MAX_INTERACTIONS_TO_CONSIDER
      ) {
        const removedInteractions = this._longestInteractionList.splice(
          this.MAX_INTERACTIONS_TO_CONSIDER
        );

        for (const interaction of removedInteractions) {
          this._longestInteractionMap.delete(interaction.id);
        }
      }
    }
  }

  protected override getReportValue(): number {
    return this._longestInteractionList[0]?._latency || 0;
  }
}
