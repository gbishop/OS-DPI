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
            csv_reader = csv.DictReader(csv_file, delimiter=',')
            item_count = 0
            for row in csv_reader:
                msg = row["Msg"] if row["Msg"] else row["Label"]
                next_row = {
                    "row": re.search("^(\d+)/", row["Row/Column"]).group(1),
                    "column": re.search("/(\d+)$", row["Row/Column"]).group(1),
                    "tags": [],
                    "msg": msg,
                }


                if(row["Graphic"]):
                    next_row.update({
                        "symbol": "{}/{}".format(sys.argv[2], row["Graphic"]),
                        "icon": row["Msg"] if row["Msg"] else row["Label"]
                    })

                output.append(next_row) 
                for conjugate in row.get("Word forms").split(','):
                    len(conjugate.strip()) and output.append({
                            "msg": conjugate.strip(),
                            "tags": [msg]
                        })
                item_count+=1
            print("{} items read".format(item_count))
    
    with open(sys.argv[3], 'w') as out:
        json.dump(output, out, indent=4)
    sys.exit(0)



main()
