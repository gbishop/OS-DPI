'''Read xkcd colors and format into a datalist'''

datalist = []

print('<datalist id="xkcd-colors">')
with open('rgb.txt', 'rt') as fp:
    for line in fp:
        if line.startswith('#'):
            continue
        name, value = line.strip().split('\t')
        print(f'  <option value="{value}">{name} {value}</option>')
print("</datalist>")
