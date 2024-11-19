# Failed attempt to use a state machine, this can't work
# Jan 2023
import re
from pyeda.inter import *

ttest = """
event        | Old State     |  New State
Input        |  Pending      |       Pending
Into Delayed |  In   Out  In |  Emit In   Out  In
F    F          F    F    F     F    F    T    F
F    F          F    F    T     F    F    T    T
F    F          F    T    F     F    F    T    F
F    F          F    T    T     F    F    T    T
F    F          T    F    F     F    T    T    F
F    F          T    F    T     F    T    T    T
F    F          T    T    F     F    T    T    F
F    F          T    T    T     F    T    T    T
                                          
F    T          F    F    F     F    F    F    F
F    T          F    F    T     F    F    F    T
F    T          F    T    F     F    F    F    F
F    T          F    T    T     F    F    F    F
F    T          T    F    F     F    T    F    F
F    T          T    F    T     F    T    F    T
F    T          T    T    F     T    T    F    F
F    T          T    T    T     T    T    F    F

T    F          F    F    F     F    T    F    F
T    F          F    F    T     F    T    F    T
T    F          F    T    F     F    T    T    F
T    F          F    T    T     F    T    T    T
T    F          T    F    F     F    T    F    F
T    F          T    F    T     F    T    F    T
T    F          T    T    F     F    T    T    F
T    F          T    T    T     F    T    T    T
                                          
T    T          F    F    F     F    F    F    F
T    T          F    F    T     F    T    F    T
T    T          F    T    F     F    F    T    F
T    T          F    T    T     F    T    T    T
T    T          T    F    F     T    T    F    T
T    T          T    F    T     F    T    F    T
T    T          T    T    F     T    T    T    T
T    T          T    T    T     F    T    T    T
"""

lines = ttest.split("\n")
columns = [""] * 4
print(columns)
for line in lines[4:]:
    line = re.sub(r"\s+", "", line)
    if not line:
        continue
    line = line.replace("F", "0")
    line = line.replace("T", "1")
    line = line.replace("X", "")
    for i in range(4):
        columns[i] = columns[i] + line[5 + i]

print(columns)

X = ttvars("x", 5)

inputs = "Into Delayed PendingIn PendingOut In".split()
outputs = "Emit PendingIn PendingOut In".split()


def tojs(ast):
    if ast[0] == "or":
        return " || ".join(tojs(t) for t in ast[1:])
    elif ast[0] == "and":
        return " && ".join(tojs(t) for t in ast[1:])
    elif ast[0] == "lit":
        return ("!" if ast[1] < 0 else "") + inputs[5 - abs(ast[1])]
    else:
        return ""


for i in range(4):
    table = truthtable(X, columns[i])
    fm = espresso_tts(table)
    print(outputs[i], "=", tojs(fm[0].to_ast()))
