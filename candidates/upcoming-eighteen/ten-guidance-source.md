# More Base authoring: supplied business hours, dining dimensions and flight intent/results

These are four exact distinct Base nodes: `local-business`, `restaurant-reviews`, `flight-search-form`, `flight-results`. Keep their practical rules in SKILL.md. All records are supplied, local interactions use native controls, and no provider, live lookup, location permission, booking or payment is implied.

## local-business: supplied weekly hours without a clock

Required name/category (1–200 code points), address (1–1000), and hours (0–7 unique weekday records). Optional description up to3000, phoneLabel/timezoneLabel (1–200), services/accessibility (0–20 strings of1–200), source, initialDay and ordinary node ID. Phone and timezone are literal labels, not dialing links or executable timezone rules.

Each hours record requires day (`monday` through `sunday`), status (`hours`, `closed`, `unknown`), and periods (0–4). Optional note is up to1000. Each period is `{opens,closes,nextDay?}` with strict24-hour HH:MM values. `hours` requires1–4 periods; closed/unknown requires none. Period duration must be greater than zero and at most24 hours. Overnight closing requires nextDay:true. Supply intervals in opening order without overlap within that day. Do not infer cross-day consistency, holiday exceptions, timezone offsets or current open/closed state.

Initial day must have a supplied record; otherwise the first supplied record is used. Never use the computer's current weekday. Users can select an omitted day and see hours not supplied. Services/accessibility remain literal native disclosures. A source is an ordinary safe HTTP(S) link, not directions, calling, booking or external lookup.

```json upcoming107-only
{"version":"iui/1","body":[{"type":"local-business","name":"Example kitchen","category":"Supplied café label","address":"Illustrative address","hours":[{"day":"monday","status":"hours","periods":[{"opens":"09:00","closes":"12:00"},{"opens":"13:00","closes":"17:00"}]},{"day":"friday","status":"hours","periods":[{"opens":"18:00","closes":"01:00","nextDay":true}]},{"day":"sunday","status":"unknown","periods":[]}],"initialDay":"monday","timezoneLabel":"Venue local time as supplied"}]}
```

## restaurant-reviews: choose a supplied dining dimension

Required label and restaurantName (1–200), reviews (0–60); optional description up to2000, source and ordinary ID. A review requires unique key ID, author1–200, text1–6000 and occasion (`breakfast`, `lunch`, `dinner`, `other`, `unknown`). Optional numeric rating/food/service/atmosphere scores are0–5. JSON `rating` is the overall dimension; never substitute it for a missing food/service/atmosphere score. Zero is valid and omission is unknown, not zero. Optional visitDate is a real Gregorian YYYY-MM-DD date, years1000–9999; dishes is0–12 labels of1–200; per-review source preserves attribution without verifying the author or claim.

The chosen dimension drives both visible score and minimum threshold. Every numeric threshold, including zero, excludes reviews missing that dimension. Text search matches author, review text and dish labels; occasion combines with other filters. Preserve source order and full native disclosures; do not invent averages, weights, rankings or verification. Reset clears filters. No feed, voting, posting or authentication occurs.

```json upcoming107-only
{"version":"iui/1","body":[{"type":"restaurant-reviews","label":"Supplied dining notes","restaurantName":"Example kitchen","reviews":[{"id":"zero","author":"Example diner A","text":"A synthetic record with an explicitly supplied zero service score.","occasion":"lunch","rating":3,"food":4,"service":0,"dishes":["Example soup"]},{"id":"unknown","author":"Example diner B","text":"Only this supplied text is available.","occasion":"unknown"}]}]}
```

## flight-search-form: prepare local intent from supplied airports

Required label1–200 and airports (2–80 unique `{code,label}` choices). Codes are exact uppercase three-letter strings; labels1–200. Optional description up to2000, disabled, initialOrigin/initialDestination, initialDepartureDate/initialReturnDate, initialTravelers and ordinary ID. No airport lookup or present-day default is implied.

Initial airports, if supplied, must exist and differ. Dates are real Gregorian YYYY-MM-DD, years1000–9999. An initial return needs a departure and cannot precede it. Initial travelers is an integer1–9, default1. Omitted route/dates create a valid incomplete draft. Prepare requires two different supplied airports, departure, optional ordered return and decimal whole travelers1–9. Runtime traveler text permits leading zeros and trailing `.0` digits, max64 characters; exponents and nonzero fractional tails are rejected rather than rounded. Invalid Prepare retains the draft and focuses the relevant owned control.

Frozen `iui:flight-search` detail is `{componentId,origin,destination,departureDate,returnDate,travelers}`. The event bubbles, is cancelable and non-composed. It is local intent only, not an external search request. Cancellation retains the draft; repeated explicit preparation is allowed and synchronous reentry is blocked. Inputs have no names/bindings and are dissociated from outside native forms. Explicit reset restores authored initial values.

```json upcoming107-only
{"version":"iui/1","body":[{"type":"flight-search-form","label":"Prepare a local example intent","airports":[{"code":"AAA","label":"Example origin"},{"code":"BBB","label":"Example destination"}]}]}
```

## flight-results: filter supplied itineraries, never compare unlabeled money

Required label1–200 and results (0–40). Optional description up to2000, source and ordinary ID. Each result requires unique key ID, label1–200 and legs (1–8); optional price, note up to2000 and source. A leg requires unique key ID within that result, carrier/number (1–200), departure and arrival endpoints, optional cabin1–200. Endpoints contain uppercase three-letter airport and strict minute timestamp with Z or an offset up to±14:00; optional name1–200. Use actual Gregorian dates, years1000–9999. Each arrival must be strictly later than departure as an offset-adjusted instant; later legs must not depart before the preceding arrival.

Optional price is supplied nonnegative amount≤1e12 with uppercase three-letter currency. Missing price stays unknown, while zero is real zero. No fare, availability, fee, tax, quote, exchange rate or booking is calculated.

Carrier filtering matches any leg's exact supplied carrier label. Stops means leg count minus one, not inferred route structure. Currency filtering admits only explicitly priced results in that exact currency. Price sorting requires selecting a supplied currency first; clearing it resets price order to supplied order. Departure sorting compares initial offset-adjusted instants. Duration sorting uses final arrival minus initial departure, including connections. Ties retain supplied order. Native details keep identity while filtering/sorting; rows moved outside are never reclaimed.

Frozen cancelable, bubbling, non-composed `iui:flight-result-select` detail is `{componentId,resultId}`. Accepted events change local pressed selection only; cancellation preserves the previous choice. Reset clears filters but keeps selection. Nothing is booked, purchased, reserved or sent remotely.

```json upcoming107-only
{"version":"iui/1","body":[{"type":"flight-results","label":"Supplied synthetic results","results":[{"id":"zero","label":"Explicit zero-price example","price":{"amount":0,"currency":"USD"},"legs":[{"id":"a","carrier":"Example Air","number":"EA 1","departure":{"airport":"AAA","at":"2028-02-29T09:00Z"},"arrival":{"airport":"BBB","at":"2028-02-29T11:00Z"}}]},{"id":"unknown","label":"No supplied price","legs":[{"id":"b","carrier":"Example Air","number":"EA 2","departure":{"airport":"AAA","at":"2028-02-29T12:00+01:00"},"arrival":{"airport":"BBB","at":"2028-02-29T15:00+01:00"}}]}]}]}
```

## Reject rather than repair

Duplicate/unknown initial weekday → BUSINESS_DAY; incompatible hours status/periods → BUSINESS_HOURS; nonpositive or over24-hour period → BUSINESS_PERIOD at closes; unordered/overlapping periods → BUSINESS_OVERLAP at the later opens. Strict HH:MM shape violations are structural errors.

Duplicate dining IDs → DUPLICATE_ID; impossible visit date → DINING_DATE; scores outside0–5, null instead of an omitted score, and unsupported ranking/provider fields are structural errors.

Duplicate airport choices → DUPLICATE_ID; unknown initial airport → SEARCH_AIRPORT; identical initial airports → SEARCH_ROUTE; impossible initial date → SEARCH_DATE; return without departure or earlier return → SEARCH_RETURN. Fractional initial travelers is a structural error; incomplete runtime drafts remain legal documents.

Duplicate result/leg IDs → DUPLICATE_ID; impossible timestamp → FLIGHT_TIME; reversed leg/connection chronology → FLIGHT_ORDER; unsafe sources → UNSAFE_URL. Never silently substitute a date, guess an airport, drop bad fields or coerce currency.

Shared controls require actual live ownership and enabled, visible/non-inert ancestry. Native reader resets respect cancellation, newer input, partial movement and shadow roots; no outside-owned DOM is rewritten. Unrelated state updates retain local controls/disclosures. Update replaces the authored snapshot and disposal retires callbacks. All text is literal and source links are absolute HTTP(S) with opener/referrer protection, without prefetch or automatic navigation.
