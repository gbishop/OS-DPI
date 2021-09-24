import csv
import re

print("export const BangColors = {")
with open("bang.csv", "rt") as fp:
    reader = csv.DictReader(fp, delimiter="\t")
    for row in reader:
        rgb = tuple(int(row[c]) for c in "rgb")
        value = "#%02x%02x%02x" % rgb
        name = re.sub(r"^\d+ ", "", row["name"]).lower()
        print(f'  "{name}": "{value}",')
print("};")
