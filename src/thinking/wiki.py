import json
import sys
import re
from string import Template
from textwrap import fill

wiki = "wiki"

panels = { "Layout": "Layout", "Actions": "Actions", "CueList": "Cues", "PatternList": "Patterns", "MethodChooser": "Methods" }
toRender = list(panels.keys())
alreadyRendered = set()

components = json.load(open("components.json", "r"))

friendlyNamesMap = {
  "ActionCondition": "Condition",
  "ActionUpdate": "Update",
  "TabControl": "Tab Control",
  "CueCss": "Cue",
  "CueFill": "Cue",
  "CueList": "Cues",
  "PatternList": "Patterns",
  "MethodChooser": "Methods",
  "PatternManager": "Pattern",
  "PatternGroup": "Group",
  "PatternSelector": "Selector",
  "GroupBy": "Group by",
  "OrderBy": "Order by",
  "TimerHandler": "Timer handler",
  "PointerHandler": "Pointer Handler",
  "KeyHandler": "Key Handler",
  "HandlerCondition": "Condition",
  "HandlerResponse": "Response",
  "GridFilter": "Filter",
  "TabPanel": "Tab Panel",
}

def friendlyName(name):
    name = friendlyNamesMap.get(name, name)
    return ' '.join(re.sub('([A-Z][a-z]+)', r' \1', re.sub('([A-Z]+)', r' \1', name)).split())

def T(s):
    return Template(fill(re.sub(r'\s+', ' ', s)))

bp = {
    'name': T("""The name of the $component. This property is used in
                     [actions](Actions) to specify the [origin](Acions#Origin)
                     of an event."""),
    'background': T("""The [color](Color) of the background in the $component."""),
    'scale': T("""The size of the $component relative to the other
    components in the same [stack](Stack)."""),
}


def render(component):
    fname = f'{wiki}/{component}.md'
    with open(fname, "w") as fp:
        stdout = sys.stdout
        sys.stdout = fp
        info = components[component]
        print(f'# {friendlyName(component)}')
        print()
        print('Description goes here')
        print()

        if component not in panels:
            if info['props']:
                print('## Properties')
                print()
                for prop, ptype in info['props'].items():
                    if prop == 'Key':
                        continue
                    print(f'### {friendlyName(prop).title()}')
                    if prop in bp:
                        print(bp[prop].substitute(component=component, ptype=ptype))
                    else:
                        print(ptype)
                    print()

        if len(info['children']) > 0:
            print('## Components you may add')
            print()
            for child in sorted(info['children']):
                print(f'- [{friendlyName(child)}]({child})')
                toRender.append(child)
        sys.stdout = stdout
        alreadyRendered.add(name)

for name in toRender:
    if name in alreadyRendered:
        continue
    render(name)
