import * as rx from "rxjs";

class Source {
  /**
   * @type {any[]}
   */
  events = [];
  sequence = 0;

  /** @param {number} to
   * @param {number} time
   */
  move(to, time) {
    if (this.events.length) {
      this.events.push({
        type: "out",
        time,
        node: this.events[this.events.length - 1].node,
        group: this.events[this.events.length - 1].group,
        sequence: this.sequence++,
      });
    }
    this.events.push({
      type: "over",
      time,
      node: to,
      group: Math.trunc(to / 4),
      sequence: this.sequence++,
    });
  }

  play() {
    const start = Date.now();
    return rx.from(this.events).pipe(
      rx.mergeMap((event) => rx.of(event).pipe(rx.delay(event.time))),
      rx.map((e) => ({ ...e, timestamp: Date.now() - start })),
      rx.share()
    );
  }
}

const s = new Source();

for (let i = 0; i < 20; i++) {
  s.move(i, i * 100);
}

let s$ = s.play();

const table = document.createElement("table");
document.body.appendChild(table);
function addRow(...args) {
  const row = document.createElement("tr");
  args.forEach((field) => {
    const cell = document.createElement("td");
    cell.innerText = field?.toString() || "";
    row.appendChild(cell);
  });
  table.appendChild(row);
  return row;
}
const rstart = Date.now();
function report(e) {
  console.log(Date.now() - rstart, e.timestamp, e.type, e.node, e.group);
}

const delay = {
  over: 300,
  out: 300,
};

let d$ = s$.pipe(
  rx.mergeMap((event) =>
    rx.of(event).pipe(
      rx.delay(delay[event.type]),
      rx.map((e) => ({ ...e, delayed: true }))
    )
  )
);

s$ = s$.pipe(rx.mergeWith(d$));

addRow("sequence", "time", "into", "isin", "pin", "pout");
s$ = s$.pipe(
  rx.groupBy((e) => e.group),
  rx.mergeMap((g$) =>
    g$.pipe(
      rx.scan(
        (state, input) => {
          const { isin, pin, pout } = state;
          const { delayed } = input;
          const into = input.type == "over";

          const row = addRow(input.sequence, input.time, into, isin, pin, pout);
          if (input.delayed) {
            row.style = "color: red";
          }

          if (!isin && !pin && !pout) {
            if (!into || (into && delayed))
              return { isin, pin, pout, emit: false, input };
            if (into && !delayed)
              return {
                isin: false,
                pin: true,
                pout: false,
                emit: false,
                input,
              };
          } else if (!isin && pin && !pout) {
            if ((!into && delayed) || (into && !delayed))
              return { isin, pin, pout, emit: false, input };
            if (!into && !delayed)
              return { isin: false, pin: true, pout: true, emit: false, input };
            if (into && delayed)
              return { isin: true, pin: false, pout: false, emit: true, input };
          } else if (!isin && pin && pout) {
            if (!into && !delayed)
              return { isin, pin, pout, emit: false, input };
            if (!into && delayed)
              return {
                isin: false,
                pin: false,
                pout: false,
                emit: false,
                input,
              };
            if (into && !delayed)
              return {
                isin: false,
                pin: true,
                pout: false,
                emit: false,
                input,
              };
            if (into && delayed)
              return { isin: true, pin: false, pout: false, emit: true, input };
          } else if (isin && !pin && !pout) {
            if (delayed || into) return { isin, pin, pout, emit: false, input };
            if (!into && !delayed)
              return { isin: true, pin: false, pout: true, emit: false, input };
          } else if (isin && !pin && pout) {
            if ((into && delayed) || (!into && !delayed))
              return { isin, pin, pout, emit: false, input };
            if (into && !delayed)
              return { isin: true, pin: true, pout: true, emit: false, input };
            if (!into && delayed)
              return {
                isin: false,
                pin: false,
                pout: false,
                emit: true,
                input,
              };
          } else if (isin && pin && pout) {
            if (into && !delayed)
              return { isin, pin, pout, emit: false, input };
            if (!into && delayed)
              return {
                isin: false,
                pin: false,
                pout: false,
                emit: true,
                input,
              };
            if (into && delayed)
              return {
                isin: true,
                pin: false,
                pout: false,
                emit: false,
                input,
              };
            if (!into && !delayed)
              return {
                isin: true,
                pin: false,
                pout: true,
                emit: false,
                input,
              };
          } else {
            console.error("should not happen");
            return { isin: false, pin: false, pout: false, emit: false, input };
          }
          // console.log(input);
        },
        { isin: false, pin: false, pout: false, emit: false, input: {} }
      )
      // rx.tap((e) => console.log(e))
    )
  )
);

s$ = s$.pipe(
  rx.filter((e) => !!e.emit),
  rx.map((e) => e.input)
);

s$.subscribe(report);

/*
// add delayed versions

s$ = Groups$.pipe(
  rx.mergeMap((group$) =>
    group$.pipe(
      rx.scan(
        ({ current, pending, emit }, input) => {
          if (pending && pending.sequence == input.sequence) {
            return { current: input, pending: null, emit: input };
          } else if (input.delayed) {
            return { current, pending, emit: false };
          } else if (input.type != current.type) {
            return { current, pending: input, emit: null };
          } else {
            return { current: input, pending: null, emit: null };
          }
        },
        { current: { type: "" }, pending: null, emit: null }
      )
    )
  )
);

// select only the emit entries
s$ = s$.pipe(
  rx.filter((e) => e.emit),
  rx.map((e) => e.emit)
);

s$.subscribe(report);

*/
