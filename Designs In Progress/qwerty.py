import csv

r1 = "`,1,2,3,4,5,6,7,8,9,0,-,=,Backspace".split(",")
s1 = "~,!,@,#,$,%,^,&,*,(,),_,+,Backspace".split(",")
w1 = [60] * 13 + [120]
r2 = "Tab,q,w,e,r,t,y,u,i,o,p,[,],\\".split(",")
s2 = "Tab,Q,W,E,R,T,Y,U,I,O,P,{,},|".split(",")
w2 = [90] + [60] * 12 + [90]
r3 = "Lock,a,s,d,f,g,h,j,k,l,;,',Enter".split(",")
s3 = 'Lock,A,S,D,F,G,H,J,K,L,:,",Enter'.split(",")
w3 = [105] + [60] * 11 + [135]
r4 = "Shift;z;x;c;v;b;n;m;,;.;/;Shift".split(";")
s4 = "Shift;Z;X;C;V;B;N;M;,;.;/;Shift".split(";")
w4 = [135] + [60] * 10 + [165]
r5 = "Ctrl,Win,Alt, ,Alt,Win,Menu,Ctrl".split(",")
w5 = [90, 60, 90, 360, 90, 60, 60, 90]

rows = [
    {"U": s1, "L": r1, "width": w1},
    {"U": s2, "L": r2, "width": w2},
    {"U": s3, "L": r3, "width": w3},
    {"U": s4, "L": r4, "width": w4},
    {"U": r5, "L": r5, "width": w5},
]


with open("qwerty.csv", "w", newline="") as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(
        ["tags_0", "tags_1", "message", "x", "y", "w", "h", "invisible", "image"]
    )
    writer.writerow(["keyboard", "*", "", "", "", "", "", "", "qwerty.svg"])
    h = 60 * 100 / 300
    for r, row in enumerate(rows):
        for case in "UL":
            x = 0
            y = h * r
            for i, letter in enumerate(row[case]):
                w = row["width"][i] * 100 / 900
                writer.writerow(
                    [
                        "keyboard",
                        case,
                        letter,
                        round(x, 2),
                        round(y, 2),
                        round(w, 2),
                        round(h, 2),
                        0,
                        "",
                    ]
                )
                x += w
