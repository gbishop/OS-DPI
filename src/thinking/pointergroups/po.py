# experiment with the PO truthtable algorithm
# failed

from collections import namedtuple

Input = namedtuple("Input", ["into", "delayed"])
State = namedtuple("State", ["on", "pin", "pout", "emit"])


def step(inp, old):
    on, pin, pout, emit = old

    if inp.into and not inp.delayed and not old.on:
        pin = True
        pout = False

    if not inp.into and not inp.delayed and old.on:
        pout = True
        pin = False

    if inp.into and inp.delayed and old.pin and not old.on:
        on = True
        pin = False

    if not inp.into and inp.delayed and old.pout and old.on:
        on = False
        pout = False

    emit = old.on != on

    if on:
        pin = False

    if not on:
        pout = False

    return State(on, pin, pout, emit)
