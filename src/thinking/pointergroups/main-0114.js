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
        sequence: this.sequence++,
      });
    }
    this.events.push({
      type: "over",
      time,
      node: to,
      sequence: this.sequence++,
    });
  }

  play() {
    return rx
      .from(this.events)
      .pipe(rx.mergeMap((event) => rx.of(event).pipe(rx.delay(event.time))));
  }
}

const s = new Source();

s.move(0, 0);
s.move(1, 100);
s.move(2, 200);
s.move(8, 250);
s.move(3, 275);
s.move(1, 300);
s.move(2, 400);
s.move(3, 500);
s.move(4, 600);
s.move(5, 700);
s.move(3, 800);
s.move(2, 1000);

let s$ = s.play();

function report(e) {
  console.log(e.actual, e.type, e.node, e.group);
}
// add groups
s$ = s$.pipe(rx.map((e) => ({ ...e, group: Math.trunc(e.node / 4) })));

const overDelay = 110;
const outDelay = 125;

// add delayed versions
let Dover$ = s$.pipe(
  rx.filter((e) => e.type == "over"),
  rx.delay(overDelay)
);
let Dout$ = s$.pipe(
  rx.filter((e) => e.type == "out"),
  rx.delay(outDelay)
);
let D$ = Dover$.pipe(
  rx.mergeWith(Dout$),
  rx.map((e) => ({ ...e, delayed: true }))
);

const start = Date.now();
s$ = s$.pipe(
  rx.mergeWith(D$),
  rx.map((e) => ({ ...e, actual: Date.now() - start }))
);

// split into groups and process them separately
let Groups$ = s$.pipe(rx.groupBy((e) => e.group));

/* State transition table
 *
 * In the input column
 *   over = pointerover
 *   dover = pointerover delayed by debounce time
 *   out = pointerout
 *   dout = pointerout delayed by debounce time
 *
 * The state consists of 4 bits.
 *   Emit is T for events to send to the stream
 *   Over is T if we are currently over a group
 *   Pending Out is T if we have seen an Out event but the debounce interval has not elapsed.ts
 *   Pending Over is T if we have seen an Over event but the debounce interval has not elapsed.
 *
 *   X is don't care.
 */

// prettier-ignore
const stext = `
event  Old State            New State
Input            Pending              Pending
       Emit Over Out Over   Emit Over Out  Over
over   X    F    F    F     F    F    F    T
over   X    F    F    T     F    F    F    T
over   X    F    T    F     F    F    F    T
over   X    F    T    T     F    F    F    T
over   X    T    F    F     F    T    F    F
over   X    T    F    T     F    T    F    F
over   X    T    T    F     F    T    F    F
over   X    T    T    T     F    T    F    F
                                      
dover  X    F    F    F     F    F    F    F
dover  X    F    F    T     T    T    F    F
dover  X    F    T    F     F    F    T    F
dover  X    F    T    T     T    T    F    F
dover  X    T    F    F     F    T    F    F
dover  X    T    F    T     F    T    F    F
dover  X    T    T    F     F    T    T    F
dover  X    T    T    T     F    T    T    F
                                      
out    X    F    F    F     F    F    F    F
out    X    F    F    T     F    F    F    F
out    X    F    T    F     F    F    T    F
out    X    F    T    T     F    F    T    F
out    X    T    F    F     F    T    T    F
out    X    T    F    T     F    T    T    F
out    X    T    T    F     F    T    T    F
out    X    T    T    T     F    T    T    F
                                      
dout   X    F    F    F     F    F    F    F
dout   X    F    F    T     F    F    F    T
dout   X    F    T    F     F    F    T    F
dout   X    F    T    T     F    F    T    T
dout   X    T    F    F     F    T    F    F
dout   X    T    F    T     F    T    F    T
dout   X    T    T    F     T    F    F    F
dout   X    T    T    T     T    F    F    T
`;

/** @param {string} text */
function makeTT(text) {
  const lines = text
    .split("\n") // split into lines
    .slice(4) // skip header
    .filter((line) => !line.match(/^\s+$/)); // skip blank lines
  const result = {};
  for (const line of lines) {
    const fields = line.split(/\s+/g);
    const input = fields[0];
    const bits = fields
      .slice(1)
      .join("")
      .replace(/[XF]/g, "0")
      .replace(/T/g, "1");
    const state = parseInt(bits.slice(0, 4), 2);
    const newst = parseInt(bits.slice(4, 8), 2);
    if (!(input in result)) result[input] = [];
    result[input][state] = newst;
  }
  return result;
}
const TT = makeTT(stext);

// Apply the SM to the groups and merge the result
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
