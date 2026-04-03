# RouteFlow — MVP Product Requirements Document (PRD)

## 📅 Date

2026

## 🚀 Product Name

**RouteFlow**

## 🎯 Tagline

**Never lose a ride again**

---

# 1. 🧠 Overview

RouteFlow is a mobile-first application designed for independent transportation drivers who receive ride assignments via text messages (not Uber/Lyft).

The app provides a centralized place to:

* manage rides (one-time and recurring)
* track daily and weekly schedules
* communicate quickly with riders/parents
* track earnings and generate weekly reports

The goal is to eliminate chaos from text-based ride coordination and replace it with a clean, fast, driver-first experience.

---

# 2. 👥 Target Users

## Primary User

* Independent drivers working with:

  * Social services transportation
  * School transport
  * Foster care / visitation transport
  * Private contract driving

## User Characteristics

* Not highly technical
* Relies on SMS for assignments
* Needs speed and simplicity
* Works on tight schedules

---

# 3. 🧱 Tech Stack

## Mobile App

* **Expo (React Native)**
* **TypeScript**
* **NativeWind (Tailwind for React Native)**

## Backend (MVP)

* **Supabase**

  * Postgres DB
  * Auth (optional for MVP)
  * Storage (future)
  * Realtime (future)

## Navigation

* React Navigation

## Maps Integration

* Deep linking:

  * Waze (default option)
  * Google Maps
  * Apple Maps

## Messaging (MVP)

* SMS deep links (no in-app chat yet)

---

# 4. 🧩 Core Features (MVP Scope)

## 4.1 Today Screen (Home)

### Purpose

Driver’s daily command center

### Requirements

* Display greeting + date
* Show total rides for the day
* Highlight **Next Ride**

### Next Ride Card

* Rider name
* Time
* Pickup → Dropoff
* Countdown (e.g., “Starts in 12 min”)
* Progress indicator (e.g., “Ride 1 of 3”)

### Actions

* Primary:

  * Navigate
* Secondary:

  * On My Way
  * 5 Min Away
  * Picked Up

### Additional

* List of upcoming rides (“Later Today”)

---

## 4.2 Week Screen

### Purpose

View full weekly schedule

### Requirements

* Horizontal day selector (Mon–Sun)
* List rides grouped by day

### Ride Card Includes

* Time
* Rider name
* Route summary
* Type:

  * Single
  * Round Trip
* Status:

  * Scheduled
  * Completed
  * Canceled

---

## 4.3 Add / Edit Ride

### Purpose

Create rides quickly

### Ride Types

* Single Trip
* Round Trip

---

### Fields

#### Rider

* Name
* Phone (optional)

#### Trip Details

**Outbound**

* Pickup address
* Dropoff address
* Pickup time

**Return (if round trip)**

* Return pickup time
* Return dropoff address

---

#### Payment

* Amount

---

#### Recurrence

Options:

* One-time
* Every weekday
* Custom days (select Mon–Sun)

---

### Behavior

* Creating recurring rides generates future occurrences
* Minimal typing required

---

## 4.4 Ride Detail Screen

### Purpose

View and manage a specific ride

### Includes

* Rider name
* Date
* Trip type

### Route Display

* Pickup → Dropoff → Return (if applicable)

---

### Actions

* Navigate (default map app)
* Quick Messages:

  * On My Way
  * Picked Up
  * ETA

---

### Status

* Scheduled
* In Progress
* Completed
* Canceled

---

### Editing

* Edit ride
* Cancel:

  * This occurrence only
  * Entire series

---

## 4.5 Earnings Screen

### Purpose

Track weekly earnings

### Includes

* Week selector
* Total earnings (large, prominent)
* Emotional indicator:

  * “Great week”
  * “Slow week”

---

### Stats

* Total rides
* Completed rides
* Canceled rides

---

### Ride Breakdown

* Date
* Rider
* Time
* Amount

---

### Action

* Share Weekly Report

---

## 4.6 Weekly Report Screen

### Purpose

Generate shareable report

### Includes

* Driver name
* Week range
* Total earnings
* Total rides

---

### Breakdown Table

* Date
* Rider
* Amount

---

### Export Options

* Share as text
* Export as PDF
* Screenshot-friendly layout

---

## 4.7 Account Screen

### Includes

* Name
* Phone number

---

### Preferences

* Default navigation app:

  * Waze
  * Google Maps
  * Apple Maps

* Notifications toggle

---

### Support

* Help Center
* Privacy Policy

---

### Action

* Logout

---

# 5. 🧠 Data Model (MVP)

## TripGroup

* id
* driver_id
* rider_name
* phone
* trip_type (single | round_trip)
* pay_amount
* recurrence_type (none | weekday | custom)
* recurrence_days (array)
* notes
* created_at

---

## TripOccurrence

* id
* trip_group_id
* service_date
* status (scheduled | completed | canceled)
* override_pay_amount (nullable)

---

## TripLeg

* id
* trip_occurrence_id
* leg_type (outbound | return)
* pickup_address
* dropoff_address
* pickup_time
* status

---

# 6. ⚙️ Key Behaviors

## Recurrence

* Generate future occurrences
* Allow single occurrence cancellation

---

## Status Flow

Scheduled → In Progress → Completed
OR
Scheduled → Canceled

---

## Navigation

* Deep link into selected map app

---

## Messaging

* Pre-filled SMS messages

---

# 7. 🎨 Design Principles

* Minimal, fast, focused
* One primary action per screen
* Dark mode default
* Clear hierarchy
* Large tap targets

---

# 8. 🚫 Out of Scope (MVP)

* Dispatcher dashboard
* Live GPS tracking
* Guardian app
* In-app chat
* Payments processing
* Notifications backend

---

# 9. 🚀 Future Scope

* Dispatcher SaaS (GuardianTrack)
* Real-time tracking
* Audit logs
* Agency compliance features
* Multi-user system

---

# 10. 🎯 Success Metrics

* Driver can add ride in < 15 seconds
* Driver uses app daily
* Driver reduces reliance on text messages
* Weekly report is shared with dispatcher
