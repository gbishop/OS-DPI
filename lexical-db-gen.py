import csv
import sys
import re
import json

# argv[1]: csv file containing records
# argv[2]: directory containing alphabet/symbol set
# argv[3]: name of output file

def main():
    if(len(sys.argv)-1 and re.search(".*\.csv$", sys.argv[1])):
        output = []
        with open(sys.argv[1]) as csv_file:
            csv_reader = csv.reader(csv_file, delimiter=',')
            next(csv_reader)
            item_count = 0
            for row in csv_reader:
                output.append({
                    "row": re.search("^(\d+)/", row[0]).group(1),
                    "column": re.search("/(\d+)$", row[0]).group(1),
                    "tags": [],
                    "msg": row[1],
                    "icon": row[1],
                    "symbol": "{}/{}".format(sys.argv[2], row[2])
                }) 
                item_count+=1
            print("{} items read".format(item_count))
    
    with open(sys.argv[3], 'w') as out:
        json.dump(output, out, indent=4)
    sys.exit(0)



main()
