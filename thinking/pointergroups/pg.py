# think about how accumulation should work
# this seems to work, now to implement it using rxjs.

import random

# create set of events
events = []

nodes_per_group = 3


class Event:
    def __init__(self, kind, node, group, timestamp):
        self.kind = kind
        self.node = node
        self.group = group
        self.timestamp = timestamp


tick = 0


def addEvent(timestamp, kind, node):
    global tick
    while tick < timestamp:
        events.append(Event("Tick", 0, 0, tick))
        tick += 10
    group = node // nodes_per_group + 1
    events.append(Event(kind, node, group, timestamp))


time = 0
isin = False
node = 0

# random.seed(0)

In_threshold = 100
Out_threshold = 200

while time < 10000:
    if not isin:
        node += 1
        addEvent(time, "Over", node)
        time += random.randint(In_threshold, In_threshold + 500)
    else:
        addEvent(time, "Out", node)
        time += random.randint(0, Out_threshold - 50)
        # add a noisy transition to another node outside the group
        if random.randint(0, 100) < 50:
            addEvent(time, "Over", node + 100)
            time += random.randint(0, In_threshold - 50)
            addEvent(time, "Out", node + 100)
    isin = not isin

Out_group = 0


class State:
    def __init__(self):
        # group we are currently in
        self.current_group = Out_group
        # accumulator for each group
        self.accumulators = {}
        # group we are over now
        self.over_group = Out_group
        # last timestamp
        self.last_time = 0

    def step(self, event):
        dt = event.timestamp - self.last_time
        self.adjust_accumulators(dt)
        self.last_time = event.timestamp
        if event.kind == "Over":
            self.over_group = event.group
        elif event.kind == "Out":
            self.over_group = Out_group

    def adjust_accumulators(self, dt):
        self.decrement_others(dt)
        self.accumulators[self.over_group] = (
            self.accumulators.get(self.over_group, 0) + dt
        )
        threshold = In_threshold if self.over_group != Out_group else Out_threshold
        if self.accumulators[self.over_group] > threshold:
            self.accumulators[self.over_group] = threshold
            if self.over_group != self.current_group:
                self.update_state()

    def update_state(self):
        if self.current_group != Out_group:
            self.report("Out")
        self.current_group = self.over_group
        if self.current_group != Out_group:
            self.report("Over")

    def decrement_others(self, dt):
        for group in self.accumulators.keys():
            if group != self.over_group:
                self.accumulators[group] = max(self.accumulators[group] - dt, 0)

    def report(self, kind):
        bins = {k: v for k, v in self.accumulators.items() if v != 0}
        print(kind, self.last_time, self.current_group, bins)


state = State()

for event in events:
    state.step(event)
