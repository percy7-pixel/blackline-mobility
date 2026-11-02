# Blackline Mobility — website

A complete, single-page website for a fictional premium vehicle-rental and private-transport brand in Douala, Cameroon. Plain HTML, CSS and JavaScript. No build step, no framework, no backend, no dependencies.

> **This is a demonstration build.** Blackline Mobility is not a real company. Every vehicle, rate, location and business detail is illustrative. The site is written to say so out loud: there is a strip at the top of every page, a notice above the fleet, and a full disclaimer in the footer.

---

## 1. What is in here

```
index.html                  All page content (5 numbered sections + hero + closing CTA + footer)
assets/css/styles.css       Design system: tokens, layout, components, breakpoints
assets/js/main.js           CONFIG, WhatsApp link builder, booking form, menu, reveals
assets/fonts/               Archivo 400 / 600 / 800, subset to the glyphs this site uses
assets/img/                 9 photographs, pre-cropped and graded
vercel.json                 Cache headers + clean URLs (only needed on Vercel)
build-images.py             Re-generates the image set from Pexels originals
build-standalone.py         Builds the single-file version of the site
```

Page weight on first load: **≈ 150 KB** (HTML + CSS + JS + one hero photograph). Everything below the fold is lazy-loaded. Total image weight for a full scroll: ≈ 720 KB.

---

## 2. The two-minute client checklist

**a. Set the phone number.** Open `assets/js/main.js`. Line 16:

```js
whatsappNumber: '237653317507',   // digits only, full international format
```

That is the only place the number exists. Every booking button, every footer link and the formatted display (`+237 653 317 507`) is generated from it at load. Nothing else to edit.

Format rules: digits only, no `+`, no spaces, no leading zero — `237` followed by the local number. A non-Cameroon number simply uses its own country code.

**b. Replace the photography.** See §4.

**c. Put your studio name in the footer.** Search `index.html` for `[Your Studio Name]`.

**d. Check the copy.** All prices and specifications are in `index.html` — they are plain text, not generated.

---

## 3. How the booking flow works

1. A visitor picks a vehicle — either from the fleet card (`Book this vehicle`, which preselects that vehicle and scrolls to the form) or from the dropdown.
2. They fill in pickup, destination, both dates and passenger count. A sticky panel repeats the selection back as they type, including an estimated total (daily rate × rental days).
3. `Send booking on WhatsApp` validates the form. If anything is missing or contradictory, nothing opens: the offending fields are marked, an error summary appears at the top of the form, and focus jumps to the first problem.
4. When the form is valid, WhatsApp opens in a new tab with the whole booking already written out:

```
Hello Blackline Mobility, I would like to book a vehicle.

Vehicle: Toyota Land Cruiser
Pickup: Douala International Airport
Destination: Buea, Mile 17
Pickup date: Sat, 7 Nov 2026
Return date: Tue, 10 Nov 2026
Rental days: 3
Passengers: 4
Instructions: Flight SN 202, child seat please

(Sent from the Blackline Mobility demonstration website.)
```

**Validation rules:** vehicle required; pickup required; destination required (non-blank); pickup date required and not in the past; return date required and at least one day after pickup; passengers required. The return-date picker is floored at the day after the pickup date, and clearing the pickup date resets a now-invalid return date.

**Estimated total** = the vehicle's daily rate × rental days. It is labelled as a demonstration estimate and is never described as a quote or a reservation.

---

## 4. Photography

All nine photographs are **licensed stock from Pexels**, chosen to match the vehicle each one represents — a Land Cruiser for the Land Cruiser, a Prado for the Prado, a Corolla sedan for the Corolla, a Hiace for the Hiace. Nothing is mislabelled.

| File | Dimensions | Shows | Pexels ID |
|---|---|---|---|
| `hero.jpg` | 1600×900 | Black SUV at night, lit columns | 19019933 |
| `hero-sm.jpg` | 900×900 | Same, square crop for phones | 19019933 |
| `fleet-landcruiser.jpg` | 1200×800 | Land Cruiser 200, front ¾ | 18029616 |
| `fleet-prado.jpg` | 1200×800 | Prado, head-on | 34166841 |
| `fleet-corolla.jpg` | 1200×800 | Corolla sedan, coastal road | 37620310 |
| `fleet-hiace.jpg` | 1200×800 | Hiace high-roof van | 19548262 |
| `why-detail.jpg` | 1000×1250 | Close crop, same Prado | 34166839 |
| `final-night.jpg` | 1400×900 | Car in motion at night | 36919630 |
| `band-fleet.jpg` | 1600×560 | Row of black Land Cruisers | 18029645 |

**Why they look like one set.** Four photographs from four different shoots would normally look like four different companies. Every image is run through the same grade in `build-images.py`: heavy desaturation, cool shadows, a crushed black floor and a slight contrast lift. The fleet grid is deliberately almost monochrome; only the hero and the closing frame keep a little colour, which gives the orange somewhere to sit.

**To swap in real photography:** replace the files, keeping the same filenames and aspect ratios (fleet images are 3:2, the why-image is 4:5, hero is 16:9 with a 1:1 phone crop). Then either delete `build-images.py` or adjust its job list. If you supply originals, run them through the same grade so the grid stays coherent:

```bash
python3 build-images.py /path/to/originals
```

---

## 5. Design notes

The identity is deliberately the opposite of a hospitality site: near-black grounds, hairline rules instead of cards, zero border-radius anywhere, a single electric orange accent, and type set in Archivo at 800 with tight tracking. Section labels are numbered `01`–`05` so the page reads as a catalogue.

- **Palette:** `#08090A` black · `#0E1012` charcoal · `#24282C` hairline · `#F4F5F6` white · `#9AA1A7` grey · `#FF4A0D` orange
- **Type:** Archivo 400/600/800, self-hosted and subset (≈ 35 KB total, three files). No external font requests, no layout shift.
- **Motion:** one reveal-on-scroll fade per block, a scale on fleet photo hover, and a hairline that draws across a service item. All of it is disabled under `prefers-reduced-motion`.
- **Accessibility:** visible focus rings, a skip link, labelled inputs, `aria-expanded` on the menu button, `aria-live` on the booking summary, error text tied to its field, and real `<button>` elements for the vehicle CTAs.

---

## 6. Hosting

**GitHub Pages** — push the contents of this folder to a repository, then Settings → Pages → deploy from branch. `.nojekyll` is included in the repo zip so the `assets/` folder is served as-is.

**Vercel** — import the repository; it is detected as a static site with no build step. `vercel.json` sets long-lived caching on fonts and images and `must-revalidate` on CSS and JS, which is what you want while a site is still being edited.

**Anywhere else** — it is a static folder. Upload it.

---

## 7. Demonstration integrity

The page is built so that no reader can mistake it for a live business:

- A strip at the very top of the page: *"Demonstration website — fictional fleet, rates and business details."*
- A notice above the fleet: *"Vehicle specifications and daily rates on this page are illustrative content for a fictional business. No vehicle is offered for hire."*
- Every price is labelled a demonstration daily rate; the booking estimate is labelled *not a quotation, and not a reservation*.
- The service area is an *illustrative corridor diagram* — no office address, no claimed availability.
- The footer states the whole thing in full: fictional brand, illustrative details, no vehicle offered for hire, no booking or availability or certification or guarantee claimed, photography licensed stock.

There are **no** customer testimonials, reviews, star ratings, awards, certifications, years-in-business claims or "trusted by" logos anywhere on the page, and the QA suite asserts that.

---

## 8. Reusing this for a real client

1. Replace the number (§2a) and the photographs (§4).
2. Edit the four vehicles in `index.html`: name, category, the three spec rows, and the price. If you change a price, also change `data-rate` on the matching `<option>` in the booking form — that attribute is what the estimate uses.
3. Rename the brand: `BLACKLINE` appears in the wordmark, `<title>`, meta description, `CONFIG.brandName` in `main.js`, and the footer.
4. Delete the demonstration strip, the fleet notice, and the disclaimer paragraph in the footer — then re-run the QA suite with those assertions removed.
5. Update the service-area diagram text in the `#area` section.

Keep the `#booking` form ids intact: `vehicle`, `pickup`, `destination`, `pickupDate`, `returnDate`, `passengers`, `notes`, `bookingCta`, `summary`.
