#!/usr/bin/env tsx
/**
 * Generates public/seed-library.zip — the bundled reference library that is
 * imported automatically when a user chooses "Start fresh" in onboarding.
 *
 * Content is derived from public-domain sources (FEMA, Red Cross, CDC).
 * Library bundle license: CC-BY-4.0.
 */

import JSZip from "jszip";
import { writeFileSync } from "fs";
import { resolve } from "path";
import yaml from "js-yaml";

// ── Manifest ─────────────────────────────────────────────────────────────────

const contentAreas = [
  { path: "first-aid", title: "First Aid", icon: "🩹" },
  { path: "communications", title: "Communications", icon: "📡" },
  { path: "water", title: "Water", icon: "💧" },
  { path: "food", title: "Food & Nutrition", icon: "🥫" },
  { path: "shelter", title: "Shelter & Warmth", icon: "🏕️" },
  { path: "evacuation", title: "Evacuation", icon: "🚗" },
  { path: "documents", title: "Important Documents", icon: "📄" },
  { path: "power", title: "Power & Lighting", icon: "🔦" },
  { path: "pets", title: "Pets & Animals", icon: "🐾" },
  { path: "mental-health", title: "Mental Health & Stress", icon: "🧠" },
];

const manifest = {
  version: "1.0.0",
  content_areas: contentAreas.map(({ path, title }) => ({
    path,
    title,
    content_type: "article_collection",
  })),
};

// ── Article content ───────────────────────────────────────────────────────────

const articles: Record<string, Record<string, string>> = {
  "first-aid": {
    "bleeding-control": `---
title: Bleeding Control
last_reviewed: "2026-04-01"
sources:
  - "Stop the Bleed (American College of Surgeons)"
  - "FEMA CPG-101"
---

## Control Bleeding

Apply direct pressure with a clean cloth. Do **not** remove the cloth if it soaks through — add more material on top.

### For severe limb bleeding
- Apply a tourniquet 2–3 inches above the wound (not on a joint)
- Tighten until bleeding stops
- Note the time it was applied

### When to call 911
- Bleeding does not stop after 10 minutes of pressure
- Wound is deep, gaping, or involves the chest/abdomen
- The person loses consciousness
`,
    "burns": `---
title: Burn Treatment
last_reviewed: "2026-04-01"
sources:
  - "American Red Cross First Aid Manual"
  - "CDC Emergency Preparedness"
---

## Treating Burns

### Minor burns (first degree)
1. Cool the burn with cool (not cold) running water for 10–20 minutes
2. Do **not** use ice, butter, or toothpaste
3. Cover loosely with a sterile bandage

### Second and third degree burns
- **Do not** remove clothing stuck to the burn
- Cover loosely with a clean bandage
- Seek emergency care immediately

### Chemical burns
- Brush off dry chemicals first
- Flush with large amounts of water for 20+ minutes
- Remove contaminated clothing while flushing
`,
    "cpr-basics": `---
title: CPR Basics
last_reviewed: "2026-04-01"
sources:
  - "American Heart Association CPG 2020"
  - "Red Cross CPR Guidelines"
---

## Hands-Only CPR

For adults who suddenly collapse and are unresponsive:

1. **Call 911** (or have someone else call)
2. Push hard and fast in the center of the chest
   - At least 2 inches deep
   - 100–120 compressions per minute (beat of "Stayin' Alive")
3. Continue until emergency responders arrive

### With rescue breaths (full CPR)
- 30 compressions : 2 breaths
- Tilt head back, lift chin, pinch nose, give breath over 1 second

> Get certified — a hands-on class dramatically improves effectiveness.
`,
  },

  "communications": {
    "pace-plan": `---
title: Building a PACE Plan
last_reviewed: "2026-04-01"
sources:
  - "US Army FM 6-02 Signal Support"
  - "FEMA Emergency Communications Guide"
---

## PACE: Primary, Alternate, Contingency, Emergency

A PACE plan ensures you always have a way to communicate, even when one method fails.

| Tier | Example | When to use |
|------|---------|-------------|
| **Primary** | Cell phone / SMS | Normal conditions |
| **Alternate** | Landline / VoIP | Cell network congested |
| **Contingency** | FRS/GMRS radio | Both phone networks down |
| **Emergency** | In-person meeting point | All electronic comm fails |

### Tips
- Pre-program an out-of-area contact — local lines jam during disasters, long-distance often works
- Agree on a check-in schedule (e.g., every 6 hours)
- Write numbers down — don't rely only on your phone's memory
`,
    "radio-basics": `---
title: FRS & GMRS Radio Basics
last_reviewed: "2026-04-01"
sources:
  - "FCC FRS/GMRS Regulations"
  - "ARRL Emergency Communication Guide"
---

## Family Radio Service (FRS)

FRS radios require **no license** and are widely available.

- Range: 0.5–2 miles (more in open terrain)
- Channels 1–14 (shared with GMRS)
- Max power: 2W (channels 1–7, 15–22), 0.5W (channels 8–14)

## GMRS (General Mobile Radio Service)

GMRS offers longer range and repeater access. Requires an **FCC license** (no exam, ~$35 for 10 years, covers entire family).

### Emergency channel
- **Channel 1** (462.5625 MHz) is the common emergency calling channel

### Good practices
- Program a family channel in advance
- Keep batteries charged; store backup batteries
- Establish a calling schedule during an event
`,
  },

  "water": {
    "water-storage": `---
title: Water Storage Basics
last_reviewed: "2026-04-01"
sources:
  - "FEMA Water Storage Guide"
  - "CDC Emergency Water Storage"
---

## How Much to Store

**Minimum**: 1 gallon per person per day
**Recommended**: 1 gallon per person + 0.5 gallon per pet per day
**Duration**: At least 72 hours; ideally 2 weeks

### Storage containers
- Food-grade plastic containers (look for recycling code 1, 2, or 7)
- Commercial water storage barrels (55-gallon)
- Store-bought sealed water bottles (best shelf life)

### Do NOT use
- Milk jugs (residue harbors bacteria)
- Juice or soda containers (hard to clean)
- Non-food-grade containers

### Rotation
- Rotate stored water every 6–12 months
- Mark containers with the storage date
`,
    "water-purification": `---
title: Water Purification Methods
last_reviewed: "2026-04-01"
sources:
  - "CDC Emergency Water Treatment"
  - "EPA Drinking Water in Emergencies"
---

## When Tap Water Is Unsafe

### Boiling (most reliable)
1. Filter visible particles through a clean cloth
2. Bring to a rolling boil for **1 minute** (3 minutes above 6,500 ft)
3. Cool before drinking; store in clean covered container

### Unscented household bleach (sodium hypochlorite)
| Water amount | 6% bleach | 8.25% bleach |
|---|---|---|
| 1 quart | 2 drops | 2 drops |
| 1 gallon | 8 drops | 6 drops |
| 5 gallons | 40 drops | 30 drops |

Wait 30 minutes before drinking. Water should have a slight chlorine smell.

### Commercial tablets
- Iodine or chlorine dioxide tablets — follow package directions
- Not for pregnant women or people with thyroid conditions (iodine)

### Filters
- Ceramic or hollow-fiber filters (0.1–0.2 micron) remove bacteria and protozoa
- Do **not** remove viruses — combine with chemical treatment for unknown sources
`,
  },

  "food": {
    "emergency-food-supply": `---
title: Building an Emergency Food Supply
last_reviewed: "2026-04-01"
sources:
  - "FEMA Food Safety in an Emergency"
  - "Ready.gov Food Supply Guide"
---

## Goal: 72-Hour Minimum, 2-Week Ideal

### What to store
- Canned goods (beans, vegetables, fruit, meat, fish)
- Dried foods (rice, pasta, oats, lentils)
- Ready-to-eat items (crackers, peanut butter, granola bars)
- Comfort foods and high-energy snacks

### Calorie targets
| Person | Minimum per day |
|--------|----------------|
| Adult | 2,000 kcal |
| Child (2–8) | 1,200–1,400 kcal |
| Pregnant/nursing | Add 300–500 kcal |

### Rotation
- Use the "first in, first out" (FIFO) principle
- Check expiration dates every 6 months
- Store in a cool, dry location (under 70°F extends shelf life)

### No-cook options
Plan for at least 3 days of food that requires no cooking or heating — power may be out.
`,
    "food-safety-power-outage": `---
title: Food Safety During a Power Outage
last_reviewed: "2026-04-01"
sources:
  - "USDA Food Safety and Inspection Service"
  - "FDA Food Safety in Emergencies"
---

## The 4-Hour Rule

A full refrigerator stays cold (~40°F) for **4 hours** if unopened.
A full freezer stays safe for **48 hours** (24 hours if half full).

### Keep doors closed
Every opening lets cold air out. Minimize access and check food temps with a thermometer.

### What to discard
Discard refrigerated perishables after 4 hours above 40°F:
- Meat, poultry, seafood
- Milk, soft cheeses, eggs
- Cooked foods and leftovers
- Cut fruits and vegetables

### What is usually safe
- Hard cheeses (unopened)
- Butter and margarine
- Fruit juice
- Bread, rolls, cakes
- Opened peanut butter and jelly

> **When in doubt, throw it out.** Food poisoning is not worth the risk.
`,
  },

  "shelter": {
    "home-shelter-in-place": `---
title: Shelter in Place
last_reviewed: "2026-04-01"
sources:
  - "FEMA Shelter-in-Place Guide"
  - "CDC Emergency Preparedness"
---

## When to Shelter in Place

Shelter in place means staying inside your home and making it as safe as possible from an external threat (hazardous material spill, severe storm, civil unrest).

### Steps

1. **Go inside immediately** — bring pets
2. **Close and lock** all windows, doors, and fireplace dampers
3. **Turn off** HVAC, fans, and ventilation systems
4. **Move to an interior room** with the fewest windows
5. **Monitor emergency broadcasts** (NOAA weather radio, local alerts)

### For chemical hazards
- Seal gaps around doors/windows with plastic sheeting and duct tape
- Stay low (some gases are heavier than air)
- Do not leave until authorities say it is safe

### Safe room essentials
- Water (minimum 1 gallon/person/day)
- Portable radio (battery or hand-crank)
- Flashlight and batteries
- First aid kit
- Medications
`,
    "emergency-heat": `---
title: Staying Warm Without Power
last_reviewed: "2026-04-01"
sources:
  - "Red Cross Winter Storm Safety"
  - "FEMA Cold Weather Preparedness"
---

## Indoor Heating Alternatives

### Safe options
- **Propane or kerosene heaters** — use only in well-ventilated areas; keep fuel stored safely outside
- **Wood-burning fireplace or stove** — ensure chimney is clear and damper is open
- **Candles** — never leave unattended; keep away from flammable materials

### Carbon monoxide warning
Never use outdoor grills, camp stoves, or generators indoors. CO is odorless and can be fatal within minutes.

### Staying warm without heat
- Wear layers: moisture-wicking base, insulating mid-layer, wind/water-resistant outer
- Keep one room warm with body heat — close doors, hang blankets over windows
- Sleeping bags rated for 20°F or below are essential emergency gear
- Eat and stay hydrated — your body generates heat digesting food
`,
  },

  "evacuation": {
    "go-bag": `---
title: Go-Bag Essentials
last_reviewed: "2026-04-01"
sources:
  - "FEMA Build a Kit"
  - "Ready.gov Emergency Supply List"
---

## The 72-Hour Go-Bag

A go-bag lets you leave quickly with what you need to survive for 3 days.

### Core contents
- [ ] Water (1 liter minimum; water purification tablets)
- [ ] Food (3-day supply of non-perishables)
- [ ] First aid kit
- [ ] Flashlight + extra batteries
- [ ] Battery or hand-crank radio
- [ ] Whistle (signal for help)
- [ ] Dust masks or N95 respirators
- [ ] Plastic sheeting and duct tape
- [ ] Moist towelettes, garbage bags, and plastic ties
- [ ] Wrench or pliers (shut off utilities)
- [ ] Manual can opener
- [ ] Local maps (paper)
- [ ] Cell phone with charger + backup battery

### Personal additions
- [ ] Prescription medications (7-day supply)
- [ ] Copies of important documents (in waterproof bag)
- [ ] Cash in small bills
- [ ] Warm clothes and sturdy shoes
- [ ] Infant or pet supplies if applicable
`,
    "evacuation-planning": `---
title: Evacuation Planning
last_reviewed: "2026-04-01"
sources:
  - "FEMA Evacuation Planning"
  - "Ready.gov Plan Ahead for Disasters"
---

## Plan Before You Need It

### Know your routes
- Identify at least **two routes** out of your neighborhood
- Plan routes in different directions (in case one is blocked)
- Know alternate routes avoiding highways (which clog quickly)

### Designate meeting points
1. **Near your home** (e.g., a neighbor's driveway) — for fires or local emergencies when you can't go inside
2. **Outside your neighborhood** (e.g., a school or community center) — for neighborhood-level evacuations
3. **Out of town** (e.g., a relative's address) — for regional disasters requiring longer travel

### Practice
- Do a family evacuation drill at least once a year
- Time how long it takes to gather go-bags and load the car
- Make sure every family member knows the meeting points and out-of-area contact

### Shelter options
- Pre-identify public shelters (local emergency management website)
- Know pet-friendly shelters (not all public shelters accept animals)
- Have a contact outside your region where you can stay
`,
  },

  "documents": {
    "documents-to-copy": `---
title: Important Documents to Protect
last_reviewed: "2026-04-01"
sources:
  - "FEMA Document Preparedness"
  - "Ready.gov Financial Preparedness"
---

## Documents to Copy and Store Safely

Keep physical copies in a waterproof bag in your go-bag, plus digital copies in secure cloud storage.

### Identity documents
- [ ] Birth certificates (all family members)
- [ ] Passports
- [ ] Social Security cards
- [ ] Driver's licenses / state IDs
- [ ] Immigration documents (if applicable)

### Financial documents
- [ ] Bank account numbers and contact info
- [ ] Insurance policies (health, home, auto, life)
- [ ] Recent tax returns
- [ ] Mortgage/lease documents
- [ ] Investment account info

### Medical records
- [ ] Prescription list (drug name, dose, prescribing physician)
- [ ] Medical history summary
- [ ] Vaccination records
- [ ] Health insurance cards and policy numbers

### Contact list
- [ ] Family members (including out-of-area contacts)
- [ ] Doctor and pharmacy
- [ ] Employer/school contact
- [ ] Utilities and bank customer service

> Store originals in a fireproof safe at home. Rotate copies when documents change.
`,
  },

  "power": {
    "generator-safety": `---
title: Generator Safety
last_reviewed: "2026-04-01"
sources:
  - "CDC Generator Safety"
  - "CPSC Generator Safety Guidelines"
---

## Critical Safety Rules

### Carbon monoxide
- **Never** run a generator indoors, in a garage, or near windows/doors/vents
- Keep at least **20 feet** from any opening to the home
- Install battery-powered CO detectors on every level of your home

### Electrical safety
- Connect appliances directly with heavy-duty outdoor extension cords, OR
- Have a licensed electrician install a transfer switch (prevents back-feeding the grid — which can kill utility workers)
- **Never** plug a generator into a wall outlet

### Fuel safety
- Store gasoline in approved containers in a cool, ventilated area away from the home
- Add fuel stabilizer if storing more than 30 days
- Never add fuel while the generator is running or hot

### Maintenance
- Run the generator for 30 minutes every 3 months with a load
- Change the oil per manufacturer schedule
- Keep spare oil, filters, and spark plugs on hand
`,
    "backup-power-options": `---
title: Backup Power Options
last_reviewed: "2026-04-01"
sources:
  - "FEMA Power Outage Guide"
  - "Energy.gov Home Backup Power"
---

## Options by Budget and Need

### Battery power banks (low cost, portable)
- Powers phones, tablets, small fans, LED lights
- Capacity: 10,000–50,000 mAh
- Recharge before storms via solar panel or wall outlet

### Portable power stations (mid-range)
- Powers medical devices, laptops, small refrigerators
- Capacity: 500–2,000 Wh
- Can recharge via solar panels (off-grid capable)

### Gasoline generators (most power, most maintenance)
- Powers most home circuits (whole-house units via transfer switch)
- Requires fuel storage and rotation
- Significant CO risk — always operate outdoors

### Propane or natural gas generators
- Longer fuel storage (propane tanks or utility line)
- Quieter than gasoline
- Still requires outdoor operation

### Solar + battery systems
- No fuel cost; renewable; quiet
- Higher upfront cost
- Works only if panels are unshaded; limited in prolonged cloudy weather
`,
  },

  "pets": {
    "pet-emergency-kit": `---
title: Pet Emergency Kit
last_reviewed: "2026-04-01"
sources:
  - "ASPCA Emergency Preparedness for Pets"
  - "Ready.gov Pets and Disaster"
---

## What to Pack for Your Pet

### Essentials (72-hour supply)
- [ ] Food and water (enough for 3 days)
- [ ] Portable water bowl
- [ ] Carrier, crate, or leash
- [ ] Medications and medical records (with vet contact)
- [ ] Recent photo of you with your pet (proves ownership)

### Comfort and safety
- [ ] Familiar toy or blanket (reduces stress)
- [ ] Waste bags or litter and a disposable pan
- [ ] Paper towels and trash bags

### Medical
- [ ] Copy of vaccination records (required by most shelters)
- [ ] Flea/tick prevention
- [ ] Microchip documentation and ID tags

## Finding Pet-Friendly Shelters

Most public emergency shelters **do not accept pets** (service animals excepted). Plan ahead:
- Contact your county emergency management office for pet-friendly shelter locations
- Research pet-boarding facilities near your evacuation routes
- Ask friends or family outside the area if they can host your pets
`,
  },

  "mental-health": {
    "disaster-stress": `---
title: Managing Stress After a Disaster
last_reviewed: "2026-04-01"
sources:
  - "SAMHSA Disaster Distress Helpline"
  - "CDC Mental Health After Disasters"
---

## Normal Reactions to Abnormal Events

Feeling scared, anxious, sad, numb, or angry after a disaster is **normal**. Most people recover with time and social support.

### Common reactions
- Shock, disbelief, and denial
- Fear and anxiety about safety
- Grief, sadness, and crying
- Anger and irritability
- Sleep problems and fatigue
- Difficulty concentrating

### Helping yourself
- **Limit media exposure** — constant news coverage increases anxiety
- **Stick to routines** as much as possible
- **Stay connected** — reach out to friends, family, neighbors
- **Take care of basics** — sleep, eat, drink water, move your body
- **Avoid alcohol** — it disrupts sleep and mood

### Helping children
- Maintain normal schedules (meals, bedtime, school)
- Reassure them they are safe
- Answer questions honestly and calmly
- Watch for regression (bedwetting, clinginess, nightmares)

### When to seek help
Call **988** (Suicide & Crisis Lifeline) or **1-800-985-5990** (SAMHSA Disaster Distress Helpline) if symptoms are severe or do not improve after several weeks.
`,
  },
};

// ── Build ZIP ─────────────────────────────────────────────────────────────────

async function main() {
  const zip = new JSZip();

  // Add manifest
  zip.file("library/manifest.yaml", yaml.dump(manifest, { lineWidth: 120, noRefs: true }));

  // Add articles
  for (const [area, areaArticles] of Object.entries(articles)) {
    for (const [slug, content] of Object.entries(areaArticles)) {
      zip.file(`library/${area}/${slug}.md`, content);
    }
  }

  const blob = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const outPath = resolve(process.cwd(), "public/seed-library.zip");
  writeFileSync(outPath, blob);
  console.log(`✅ Written ${blob.length} bytes to ${outPath}`);
  console.log(`   ${contentAreas.length} areas, ${Object.values(articles).reduce((n, a) => n + Object.keys(a).length, 0)} articles`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
