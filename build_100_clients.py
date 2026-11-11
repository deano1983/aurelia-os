import csv, glob, json, os

BASE = r"C:\dev\aurelia-os"
PUBLIC = os.path.join(BASE, "mvp", "public")

rows = []
for f in sorted(glob.glob(os.path.join(BASE, "prospects-0[123]-*.csv"))):
    with open(f, "r", encoding="utf-8-sig") as fp:
        for r in csv.DictReader(fp):
            rows.append({
                "ID": int(r["ID"]),
                "Category": r["Category"],
                "Organization_or_Leader": r["Organization_or_Leader"],
                "Location": r["Location"],
                "Target_Product": r["Target_Product"],
                "Deal_Type": r["Deal_Type"],
                "Website_or_Channel": r["Website_or_Channel"],
                "Why_High_Fit": r["Why_High_Fit"],
                "Outreach_Hook": r["Outreach_Hook"],
            })

extra = [
    (31, "04. Global Exec Women Network", "Chief (Lindsay Kaplan & Carolyn Childers)", "US / UK", "Velvet Cadence ($99-$149/mo) & Sovereign Brief", "Core Group Partner", "https://chief.com/", "20,000+ VP and C-suite women with corporate professional development expense budgets.", "Hi Chief team — Chief members live in the split-brain workflow we built Aurelia OS & Velvet Cadence to solve: corporate Windows OneDrive board packs at work and iPhone voice notes/calendars in transit. We offer a Founding Executive Pass (100% corporate-expensable)."),
    (32, "04. Global Exec Women Network", "Pavilion — Women's Executive & GTM Community", "US / UK / ANZ", "Velvet Cadence ($99-$149/mo)", "30% Partner Share", "https://www.joinpavilion.com/", "Global community of female CROs, CMOs & VPs of GTM who publish weekly on LinkedIn.", "Hi Pavilion team — Velvet Cadence turns a 90-second iPhone voice note + a linked OneDrive/GDrive revenue chart into a ready-to-publish LinkedIn post and 4-slide carousel brief, pre-coded for corporate expense approval."),
    (33, "04. Global Exec Women Network", "Women in Revenue (WIR)", "San Francisco / Global", "Velvet Cadence ($99 Authority Pro)", "30% Challenge Partner", "https://womeninrevenue.org/", "7,000+ senior women in sales, marketing, and customer success building authority on LinkedIn.", "Hi Women in Revenue team — we'd love to sponsor a '7-Day 90-Seconds-to-LinkedIn-Authority Challenge' for WIR members using Velvet Cadence, with 30% recurring revenue share supporting WIR programs."),
    (34, "04. Global Exec Women Network", "Sistas in Sales (Cherilynn Castleman & Team)", "US / UK / Global", "Velvet Cadence ($49-$99/mo)", "30% Community Partner", "https://sistasinsales.com/", "10,000+ women of color in enterprise B2B sales where LinkedIn social selling drives quota.", "Hi Sistas in Sales team — we built Velvet Cadence so enterprise sellers can dictate a 90-second post-call insight on their iPhone, attach a slide from OneDrive/GDrive, and publish a LinkedIn carousel before 8:30 AM."),
    (35, "04. Global Exec Women Network", "Ellevate Network (Kristy Wallace — CEO)", "New York / Global", "Velvet Cadence & Sovereign Brief ($399/yr)", "30% Chapter Share", "https://www.ellevatenetwork.com/", "Global network of corporate women and executives running weekly chapter roundtables.", "Hi Ellevate team — we built Aurelia OS (Velvet Cadence + Sovereign Brief) for corporate women managing Windows OneDrive board deliverables alongside iPhone/iCloud personal and LinkedIn workflows."),
    (36, "04. Global Exec Women Network", "Female Founder Collective (Rebecca Minkoff & Ali Wyatt)", "US / Global", "Velvet Cadence & GlowGrid Studio ($29/mo)", "30% Perks Partner", "https://femalefoundercollective.com/", "10,000+ women-owned businesses needing both LinkedIn B2B authority and daily IG/TikTok Reels.", "Hi FFC team — your 10th House and FFC founders juggle executive decks on desktop and 4K video/voice capture on iPhone. We'd love to list Aurelia OS in the FFC perks portal with a 30% recurring partner share."),
    (37, "04. Global Exec Women Network", "Entreprenista League (Stephanie Cartin & Courtney Spritzer)", "New York / Global", "Velvet Cadence & GlowGrid Studio", "30% League Partner", "https://www.entreprenista.com/", "Top podcast & membership community spotlighting the exact software stacks of female founders.", "Hi Stephanie & Courtney — we'd love to give Entreprenista League members VIP access to Aurelia OS (our iPhone-to-Windows Cross-Cloud Command Suite) + a 30% recurring partner share."),
    (38, "04. Global Exec Women Network", "HeyMama (Executive & Founder Mothers Network)", "US / Global", "Aurelia OS Flagship ($149/mo)", "30% Community Partner", "https://heymama.co/", "5,000+ CEO, executive, and founder mothers balancing board deadlines and family boundaries.", "Hi HeyMama team — Aurelia OS features a 'Life-Work Collision Detector & 1-Tap Cascade Reschedule' that locks school pickup in Apple iCloud while automatically shifting flexible tasks around hard OneDrive board deadlines."),
    (39, "04. Global Exec Women Network", "Women in Product (WIP Global & APAC)", "Silicon Valley / Global", "Sovereign Brief ($399/yr) & Velvet Cadence", "Chapter Partner", "https://www.womenpm.org/", "30,000+ female VPs of Product & CPOs managing specs across GDrive/OneDrive and LinkedIn.", "Hi Women in Product team — female product VPs love our Zero-Blob Metadata Pointer architecture (<15KB index across iCloud, GDrive, and OneDrive with $0 server upload) paired with our 90s Voice-to-LinkedIn Studio."),
    (40, "04. Global Exec Women Network", "Luminary (Cate Luzio — Global Collaboration Hub)", "New York / Global", "Aurelia OS All-Access Suite ($149/mo)", "Corporate Partner", "https://weareluminary.com/", "Backed by 50+ enterprise corporate sponsors investing in their female leadership pipeline.", "Hi Cate — Luminary's corporate and founder members are the exact leaders we built Aurelia OS for: 100% corporate-expensable executive authority (Velvet Cadence) and cross-cloud deadline readiness (Sovereign Brief)."),
]

from cohort5 import COHORT_5
from cohort6 import COHORT_6
from cohort7 import COHORT_7
from cohort8 import COHORT_8
from cohort9 import COHORT_9
from cohort10 import COHORT_10

for tup in extra + COHORT_5 + COHORT_6 + COHORT_7 + COHORT_8 + COHORT_9 + COHORT_10:
    rows.append({
        "ID": tup[0],
        "Category": tup[1],
        "Organization_or_Leader": tup[2],
        "Location": tup[3],
        "Target_Product": tup[4],
        "Deal_Type": tup[5],
        "Website_or_Channel": tup[6],
        "Why_High_Fit": tup[7],
        "Outreach_Hook": tup[8],
    })

rows.sort(key=lambda x: x["ID"])
csv_path = os.path.join(BASE, "05-100-client-and-partner-target-list.csv")
fields = ["ID", "Category", "Organization_or_Leader", "Location", "Target_Product", "Deal_Type", "Website_or_Channel", "Why_High_Fit", "Outreach_Hook"]
with open(csv_path, "w", encoding="utf-8", newline="") as fp:
    w = csv.DictWriter(fp, fieldnames=fields)
    w.writeheader()
    w.writerows(rows)

with open(os.path.join(PUBLIC, "clients-data.js"), "w", encoding="utf-8") as fp:
    fp.write("window.AURELIA_100_CLIENTS = " + json.dumps(rows) + ";\n")

print("Saved CSV and clients-data.js with rows:", len(rows))

