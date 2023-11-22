"""Build sequenced data for a list of words"""

import pandas as pd
import numpy as np
import json
import itertools

with open('100words.txt', 'r') as fp:
    words = [ line.strip() for line in fp ]

isPrefix = [ any(word != otherword and otherword.startswith(word) for otherword in words) for word in words ]

rows = [ [word] + list(word.lower()) for word in words ]

df = pd.DataFrame(rows)


allIcons = set('abcdefghijklmnopqrstuvwxyz')
allIcons = allIcons | set(['CLEAR'])
print("total icons", len(allIcons))

# generate an index for each icon
iconIndex = {icon: i for i, icon in enumerate(sorted(allIcons))}
indexIcon = {i: icon for icon, i in iconIndex.items()}


# get symbols for each
# symbols = pd.read_csv("iconURLs.csv", index_col="icon")



def generateLevel(level, df):
    col = level + 1
    tags = [df.iloc[0, i] for i in range(1, col)]
    result = [
        {
            "msg": "CLEAR",
            # "symbol": symbols.loc["CLEAR"].url,
            "icon": "CLEAR",
            "tags": tags,
            "index": iconIndex["CLEAR"],
        }
    ]
    if col < len(df.columns) - 1:
        toSpeak = df.iloc[:, col + 1].isna()
    else:
        toSpeak = np.ones(len(df), dtype=bool)

    speak = df[toSpeak]
    for row in speak.itertuples(index=False):
        item = {
            "tags": tags,
            "msg": row[0],
            "say": row[0],
            "icon": row[col],
            "index": iconIndex[row[col]],
            # "symbol": symbols.loc[row[col]].url,
        }
        result.append(item)
    # eliminate rows with nan
    df = df[~toSpeak]
    if not df.empty:
        # get the unique icons
        icons = df.iloc[:, col].unique()
        # generate an entry for each icon
        row = df.iloc[0, :]
        tags = [row[i] for i in range(1, col)]  # or ["START"]
        for icon in icons:
            item = {
                "tags": tags,
                "msg": icon,
                "icon": icon,
                "index": iconIndex[icon],
                # "symbol": symbols.loc[icon].url,
            }
            result.append(item)
            result.extend(generateLevel(level + 1, df[df.iloc[:, col] == icon]))
    return result


allRows = generateLevel(0, df)

allRows.sort(key=lambda row: row["index"])

print("generated", len(allRows), "items")

with open("sequencedAlpha.json", "wt") as fp:
    fp.write(json.dumps(allRows, indent=2))
