# -*- coding: utf-8 -*-
"""Source-of-truth content for all 39 Lendora defense slides.
Each slide dict drives both the .pptx deck and the speaking-script .docx.
kind: title | content | screenshot | diagram_arch | diagram_workflow | diagram_db | thanks
"""

SLIDES = [

# 1 -------------------------------------------------------------------------
dict(num=1, kind="title",
    title="LENDORA",
    subtitle="A Multi-Vendor Rental Marketplace for Bangladesh",
    meta=["University Project Defense", "[Your Name]  |  [Student ID]",
          "[Department / Program]  |  [University Name]",
          "Supervisor: [Supervisor Name]", "[Date]"],
    script="Good [morning/afternoon] everyone. My name is [Your Name], and today I'll be presenting my "
           "final year project, Lendora — a full-stack multi-vendor rental marketplace built for the "
           "Bangladeshi market. In short, Lendora lets people rent everyday items like cameras, sound "
           "systems, and tools from verified local vendors instead of buying them, with built-in payments, "
           "security deposits, and dispute handling. Over the next fifteen to twenty minutes I'll walk you "
           "through the problem it solves, how it's built, and a complete tour of every major screen, "
           "following the journey of a real user from registration to final review.",
    transition="Let's start with why this project needed to exist — the real-world problem behind it."),

# 2 -------------------------------------------------------------------------
dict(num=2, kind="content",
    title="Introduction",
    bullets=[
        "Lendora is a web-based, multi-vendor rental marketplace",
        "Full-stack application: Next.js frontend + Express/Node.js REST API + MySQL database",
        "Three user roles: Customer (renter), Vendor (seller), and Admin",
        "Covers the entire rental lifecycle — discovery, booking, payment, delivery, active use, return, and refund",
        "Localized for Bangladesh: BDT currency, district/division locations, bKash & Nagad demo payments",
    ],
    script="Lendora connects two kinds of people: customers who need an item temporarily, and vendors who "
           "own items and want to earn from renting them out. It's a complete full-stack system — a Next.js "
           "frontend, an Express REST API, and a MySQL database — with three distinct user roles: Customer, "
           "Vendor, and Admin. What makes it more than a simple listing site is that it manages the entire "
           "lifecycle of a rental automatically, from the moment someone books an item until their deposit "
           "is refunded weeks later. It's also fully localized — Bangladeshi Taka currency, districts and "
           "divisions for location, and local mobile payment methods like bKash and Nagad.",
    transition="To understand why we built it this way, let's look at the real-world problem first."),

# 3 -------------------------------------------------------------------------
dict(num=3, kind="content",
    title="Problem Statement",
    bullets=[
        "People often need an item only temporarily — a camera for one event, a sound system for a wedding, tools for a single repair",
        "Buying the item outright is expensive and wasteful for one-time use",
        "Renting in Bangladesh today is almost entirely informal — Facebook groups, personal contacts, word-of-mouth",
        "No standard way to verify the other party, hold a security deposit safely, or resolve damage and late-return disputes",
        "Cash-based, untracked transactions create trust issues on both sides",
    ],
    script="Think about someone who needs a professional camera for just one wedding shoot, or a sound "
           "system for a single event. Buying it makes no financial sense, yet today in Bangladesh, the "
           "only realistic option is to ask around informally — a Facebook group, a friend of a friend, a "
           "local shop. There's no way to verify who you're dealing with, no safe way to hold a security "
           "deposit, and if the item comes back late or damaged, there's no structured way to resolve it. "
           "It's entirely based on personal trust, which doesn't scale and frequently goes wrong.",
    transition="These exact pain points shaped the objectives we set for this project."),

# 4 -------------------------------------------------------------------------
dict(num=4, kind="content",
    title="Objectives",
    bullets=[
        "Build a secure, structured platform connecting renters and vendors",
        "Automate the full rental lifecycle with clear, trackable status at every stage",
        "Protect both parties using a platform-held security deposit",
        "Automatically detect overdue rentals and apply late fees — no manual negotiation",
        "Provide an admin layer for verification, dispute resolution, and platform oversight",
        "Build trust through a two-way review and rating system",
    ],
    script="From that problem, we defined six concrete objectives. First, replace informal arrangements "
           "with a structured digital platform. Second, automate the rental lifecycle so every booking has "
           "a clear, trackable status. Third, protect both sides financially with a deposit the platform "
           "itself holds. Fourth — and this is one of the more technically interesting parts of the project "
           "— automatically detect when an item is returned late and deduct a fee, without any human "
           "stepping in. Fifth, give an admin role the tools to verify users and resolve disputes. And "
           "finally, build trust over time through reviews, in both directions — customers rating vendors "
           "and vendors rating customers.",
    transition="Before detailing our solution, let's briefly examine what's already out there."),

# 5 -------------------------------------------------------------------------
dict(num=5, kind="content",
    title="Existing System Problems",
    bullets=[
        "Facebook Marketplace / Groups — no verification, no escrow, no structured deposit handling",
        "Local rental shops — manual paperwork, cash deposits, no digital tracking of late fees or damage",
        "Generic classifieds (e.g. Bikroy-style sites) — built for one-time selling, not the rent-and-return cycle",
        "No existing solution automates overdue detection, late fees, or a structured return inspection",
        "No commission/payout system that lets everyday people become organized rental \"vendors\"",
    ],
    script="Looking at what already exists: Facebook Marketplace and local groups have zero verification or "
           "deposit protection. Physical rental shops still rely on manual paperwork and cash deposits with "
           "no digital record. General classifieds platforms like Bikroy are designed for one-time sales, "
           "not a recurring rent-and-return relationship — they have no concept of a deposit, a late fee, or "
           "a damage claim. Critically, none of them give an ordinary person the tools to become an "
           "organized rental vendor with proper payouts and commission tracking. That gap is exactly what "
           "Lendora is built to fill.",
    transition="This is exactly the gap our proposed solution fills."),

# 6 -------------------------------------------------------------------------
dict(num=6, kind="content",
    title="Proposed Solution",
    bullets=[
        "A dedicated multi-vendor rental marketplace — not a generic classifieds clone",
        "Admin-verified vendor onboarding before any product can go live",
        "A structured rental lifecycle with well-defined statuses, automated at every transition",
        "Platform-held deposit with automatic late-fee deduction and admin-mediated damage resolution",
        "Two-way review system plus admin dashboards for full transparency",
        "Realistic demo bKash/Nagad payment flow — safe for an academic build, but modeled on real gateway integration",
    ],
    script="Lendora's solution is purpose-built around the rental cycle, not adapted from a generic "
           "e-commerce template. Every vendor is verified by an admin before they can list anything. Every "
           "rental moves through a well-defined sequence of statuses, and those transitions are automated "
           "wherever possible. The deposit is held by the platform itself, and — uniquely — late fees are "
           "deducted automatically in real time, while damage is escalated to admin review. On top of that, "
           "a two-way review system and full admin dashboards keep everything transparent. And the payment "
           "flow, while running in demo mode for safety, mirrors exactly how a real bKash or Nagad "
           "integration would work.",
    transition="Let's look at how this is technically built before diving into the user experience."),

# 7 -------------------------------------------------------------------------
dict(num=7, kind="diagram_arch",
    title="System Architecture",
    bullets=[
        "Clean Architecture on the backend: Routes → Use Cases → Repositories",
        "Frontend and backend live as independent apps inside one monorepo, sharing a common types/constants package",
        "MySQL accessed through Prisma ORM for type-safe, validated database access",
        "Redis used for caching (falls back to in-memory automatically if unavailable)",
        "Nginx reverse proxy in front for production — TLS termination, rate limiting, static asset caching",
    ],
    script="Architecturally, the system is split into clean layers. The browser talks to a Next.js "
           "frontend, which calls a REST API built with Express. Inside that API, we follow Clean "
           "Architecture: HTTP routes never touch the database directly — they call use-case classes that "
           "contain the actual business rules, and those use-cases talk to repository classes that handle "
           "data access through Prisma into MySQL. Redis sits alongside for caching. Both the frontend and "
           "backend live in one monorepo and share a single TypeScript package for types and business "
           "constants, so the two sides can never drift out of sync. In production, Nginx sits in front for "
           "HTTPS, rate limiting, and caching.",
    transition="Now the specific tools and frameworks that make this architecture work."),

# 8 -------------------------------------------------------------------------
dict(num=8, kind="content",
    title="Technology Stack",
    bullets=[
        "Frontend — Next.js 15 (App Router), React, TypeScript, Tailwind CSS, TanStack Query, Zustand",
        "Backend — Node.js, Express, TypeScript, Prisma 6 ORM",
        "Database & Cache — MySQL 8, Redis",
        "Payments — bKash & Nagad gateway integration (demo mode)",
        "Tooling & Infra — pnpm workspaces + Turborepo monorepo, Docker + Nginx, JWT auth, Zod validation",
    ],
    script="On the frontend, we use Next.js 15 with React and TypeScript, styled with Tailwind CSS, with "
           "TanStack Query handling all server-state and caching, and Zustand for lightweight client state "
           "like the logged-in user. The backend is Node.js and Express, also fully in TypeScript, with "
           "Prisma 6 as the ORM layer over MySQL, and Redis for caching. Payments are integrated against "
           "bKash and Nagad gateway patterns in demo mode. And for tooling, the whole project is a pnpm and "
           "Turborepo monorepo, containerized with Docker and served through Nginx, with JWT-based "
           "authentication and Zod for runtime input validation everywhere.",
    transition="With the technical foundation clear, let's meet the people who actually use this system."),

# 9 -------------------------------------------------------------------------
dict(num=9, kind="content",
    title="User Roles",
    bullets=[
        "Customer (Renter) — browses products, books rentals, pays, tracks delivery, returns items, leaves reviews",
        "Vendor (Seller) — lists products, manages rental requests, sets pickup/return addresses, dispatches items, receives payouts",
        "Admin (Platform Operator) — verifies vendors/customers, moderates listings, resolves disputes & damage claims, monitors the whole platform",
        "Each role is enforced server-side through JWT-based authentication and role-based authorization middleware",
    ],
    script="The platform has three roles. The Customer browses, books, pays, tracks their delivery, returns "
           "the item, and leaves a review. The Vendor lists products, decides whether to accept or decline "
           "rental requests, manages pickup and return addresses, dispatches items, and receives payouts. "
           "The Admin sits above both — verifying new accounts, moderating listings, resolving disputes and "
           "damage claims, and monitoring the entire platform's health. Importantly, these aren't just UI "
           "labels — every single action is checked server-side through JWT authentication and role-based "
           "authorization middleware, so a customer account can never call a vendor-only or admin-only "
           "endpoint.",
    transition="Let's now walk through the system exactly as a user would experience it — starting with the homepage."),

# 10 -------------------------------------------------------------------------
dict(num=10, kind="screenshot",
    title="Homepage",
    what="Public landing page with a hero banner, search bar, category shortcuts, featured/trending rentals, a \"How It Works\" explainer, top-rated vendors, FAQ, and newsletter signup.",
    who="Every visitor — logged out or logged in, before they commit to a role.",
    actions="Search or browse products, jump into a category, click \"Become a Vendor,\" or log in / sign up.",
    connects="Clicking \"Browse Items\" or a category leads to the Product Marketplace; clicking \"Become a Vendor\" starts Seller Registration.",
    shots=["Homepage — hero, search & categories"],
    script="This is the first thing anyone sees. The hero section pitches the platform and has an immediate "
           "search bar, below it are category shortcuts for quick browsing, then a row of featured or "
           "trending items, a short \"How It Works\" explainer for first-time visitors, and highlights of "
           "top-rated vendors to build trust before anyone even signs up. From here, a visitor can go "
           "straight into browsing as a guest, or commit to one of two paths — register as a customer to "
           "rent something, or register as a vendor to start listing items.",
    transition="From the homepage, a new seller would click 'Become a Vendor' — let's see that flow."),

# 11 -------------------------------------------------------------------------
dict(num=11, kind="screenshot",
    title="Seller Registration",
    what="A multi-step vendor application form capturing business name, description, district/division, bKash number for payouts, and identity verification details.",
    who="A prospective vendor — someone registering to list and rent out items.",
    actions="Fill in business details, choose a location, provide a payout number, and submit the application.",
    connects="Submitting creates an account with status PENDING_VERIFICATION, which enters the Admin Verification queue before any product can be listed.",
    shots=["Seller registration — business details form"],
    script="Vendor sign-up is intentionally more than a simple form — because vendors will be handling "
           "other people's deposits and earning payouts, we collect their business name and description, "
           "their district and division for location-based search, and a bKash number that will later "
           "receive their earnings. Once submitted, the account doesn't go live immediately — it's created "
           "with a Pending Verification status and queued for admin review. This is the first line of "
           "defense against fraudulent or low-quality vendors.",
    transition="Meanwhile, a regular customer signs up through a much simpler flow."),

# 12 -------------------------------------------------------------------------
dict(num=12, kind="screenshot",
    title="Customer Registration",
    what="A standard sign-up form — name, email, phone number, and password.",
    who="A new customer who wants to rent items.",
    actions="Register an account, verify it, and log in.",
    connects="Once active, the customer lands on the Customer Dashboard — but first, let's see how the admin reviews new accounts.",
    shots=["Customer registration — sign-up form"],
    script="By contrast, customer registration is deliberately lightweight — name, email, phone number, and "
           "a password — because the barrier to becoming a renter should be low. After registering and "
           "verifying their account, the customer is taken straight to their personal dashboard. Both this "
           "flow and the vendor flow we just saw, however, share one common checkpoint before full trust is "
           "granted.",
    transition="Both new vendors and customers pass through one common checkpoint: admin verification."),

# 13 -------------------------------------------------------------------------
dict(num=13, kind="screenshot",
    title="Admin Verification Process",
    what="An admin queue listing pending vendor and customer applications with their submitted details.",
    who="The Admin — the platform operator responsible for trust and safety.",
    actions="Review submitted details, then Approve or Reject each application, optionally with a reason.",
    connects="Approved vendors move to ACTIVE status and can immediately start listing products; rejected applicants are notified with the reason.",
    shots=["Admin panel — pending vendor verification queue",
           "Admin panel — pending customer verification queue"],
    script="This is the gatekeeping step for the entire platform. The admin sees every pending vendor and "
           "customer application in one queue, with all the details they submitted at registration. From "
           "here, the admin can approve an application — instantly activating that account — or reject it "
           "with a reason, which the user is notified about. This single screen is what prevents Lendora "
           "from degrading into the same unverified chaos as Facebook Marketplace.",
    transition="With their account approved, let's enter the vendor's home base — the Seller Dashboard."),

# 14 -------------------------------------------------------------------------
dict(num=14, kind="screenshot",
    title="Seller Dashboard",
    what="The vendor's control center — key stats (total rentals, total earnings, average rating, response time), pending rental requests, a snapshot of their product list, and quick links.",
    who="The Vendor, every time they log in.",
    actions="Review pending rental requests, jump into product management or payouts, complete their business profile if it's their first visit.",
    connects="From here, a vendor's next natural step is publishing their first product.",
    shots=["Vendor dashboard — overview & stats"],
    script="Once approved, this dashboard becomes the vendor's daily home base. At a glance they see how "
           "many rentals they've completed, total earnings, their average customer rating, and how quickly "
           "they respond to requests. Below that sits the queue of pending rental requests needing a "
           "decision, and a snapshot of their current product listings. Everything a vendor needs to run "
           "their rental business day-to-day is reachable from this one screen.",
    transition="Let's see how a vendor lists a product for rent."),

# 15 -------------------------------------------------------------------------
dict(num=15, kind="screenshot",
    title="Product Publishing",
    what="The Add/Edit Product form — name, category, description, price per day/week/month, security deposit amount, condition, photos, delivery options, and location.",
    who="The Vendor.",
    actions="Fill in product details, upload photos, choose delivery method(s) — Customer Pickup and/or Courier — and submit.",
    connects="The product enters PENDING_REVIEW; once an admin approves it, it appears live on the Product Marketplace for customers to find.",
    shots=["Add product form — details & pricing", "Add product form — photo upload & delivery options"],
    script="Listing a product is straightforward but thorough — the vendor sets pricing per day, week, or "
           "month, defines a security deposit amount appropriate to the item's value, describes its "
           "condition, uploads photos, and chooses which delivery methods they support: customer pickup, "
           "courier, or both. Just like new accounts, new products don't go live instantly — they're "
           "queued for admin review to keep listing quality consistent across the marketplace.",
    transition="Now switching to the customer's side of the journey — their dashboard."),

# 16 -------------------------------------------------------------------------
dict(num=16, kind="screenshot",
    title="Customer Dashboard",
    what="The customer's home base — a hero banner, personal rental stats (active / pending / completed counts), featured rentals, categories, and top sellers.",
    who="The Customer, every time they log in.",
    actions="Check the status of current rentals at a glance, or jump straight into browsing.",
    connects="Clicking \"Browse Items\" leads to the full Product Marketplace.",
    shots=["Customer dashboard — overview & rental stats"],
    script="The customer's dashboard mirrors the homepage in spirit but personalizes it — right away they "
           "see how many rentals are active, pending, or completed, alongside the usual featured items and "
           "categories. It's designed so a returning customer can immediately check on an in-progress rental "
           "without digging through menus, while still encouraging further browsing.",
    transition="Let's look at that marketplace in detail."),

# 17 -------------------------------------------------------------------------
dict(num=17, kind="screenshot",
    title="Product Marketplace",
    what="A searchable, filterable grid of every active product listing — filter by category, price range, district, and delivery option, with sorting.",
    who="The Customer.",
    actions="Search, filter, sort, and click into any product's detail page.",
    connects="Selecting a product and choosing to rent it leads into the Rental Request flow.",
    shots=["Product marketplace — search, filters & grid"],
    script="This is the core discovery screen. Customers can search by keyword, filter by category, price "
           "range, district, or delivery option, and sort results. Each card shows the price, rating, and "
           "key delivery information up front, so customers can compare options before clicking in. This is "
           "where the platform's real value is felt — dozens of verified vendors' products, browsable from "
           "one place instead of scattered across informal groups.",
    transition="Once a customer picks an item, here's how they actually request to rent it."),

# 18 -------------------------------------------------------------------------
dict(num=18, kind="screenshot",
    title="Rental Request Process",
    what="The Rent page — the customer selects start and end dates, a delivery method (Customer Pickup or Courier), and an address if needed, while the system live-calculates the rental fee, deposit, and delivery fee.",
    who="The Customer.",
    actions="Pick dates (validated against the item's real-time availability), choose a delivery method, review the cost breakdown, and submit.",
    connects="Submitting creates a rental with status PENDING_CONFIRMATION, which lands directly in the vendor's approval queue.",
    shots=["Rent page — date selection & price breakdown"],
    script="This page does the heavy lifting of turning a browsing decision into an actual booking. The "
           "customer picks a date range — which is validated in real time against existing bookings to "
           "prevent double-booking — chooses pickup or courier delivery, and instantly sees a full price "
           "breakdown covering the rental fee, the refundable deposit, and any delivery charge. Submitting "
           "doesn't charge anything yet — it creates a pending request that the vendor must first approve.",
    transition="Now back to the vendor, who must approve or decline this request."),

# 19 -------------------------------------------------------------------------
dict(num=19, kind="screenshot",
    title="Seller Approval Process",
    what="The rental detail page's \"Your Decision\" panel, where the vendor reviews the customer's details and the booking, then Accepts, Declines, or Rejects with a reason.",
    who="The Vendor.",
    actions="Accept (entering a pickup address, and a return address with a one-click \"same as pickup\" shortcut), Decline, or Reject with a reason.",
    connects="On acceptance, the rental moves to CONFIRMED and the customer is immediately prompted to pay.",
    shots=["Rental detail — vendor decision panel (Accept / Decline / Reject)"],
    script="Every booking requires explicit vendor approval — nothing is auto-confirmed. The vendor reviews "
           "who's renting, the dates, and the price breakdown, then chooses to Accept, Decline, or Reject "
           "with a reason the customer will see. For pickup deliveries, accepting also means providing the "
           "exact pickup address, and — one of the small but genuinely useful details in this project — a "
           "single checkbox to mark the return address as \"same as pickup,\" since that's the most common "
           "case.",
    transition="With the rental confirmed, the customer now completes payment."),

# 20 -------------------------------------------------------------------------
dict(num=20, kind="screenshot",
    title="Demo Payment System",
    what="The Payment page — a full breakdown of rental fee, deposit, and delivery fee, followed by a demo bKash payment flow.",
    who="The Customer.",
    actions="Review the cost breakdown, enter a bKash number, and confirm payment.",
    connects="On success, the rental advances to CONFIRMED → READY_FOR_PICKUP, and payment and deposit records are created; the vendor is notified to prepare the item.",
    shots=["Payment page — cost breakdown & bKash flow"],
    script="Payment is where money actually changes hands — in this academic build, through a safe demo "
           "bKash flow rather than a live gateway, but the breakdown and confirmation steps mirror exactly "
           "how a production integration would behave. The customer sees the same fee breakdown from the "
           "rent page one more time before confirming, and on success, formal Payment and Deposit records "
           "are created in the database, and the vendor is notified that it's time to prepare the item.",
    transition="Next, the item physically changes hands — let's look at delivery."),

# 21 -------------------------------------------------------------------------
dict(num=21, kind="screenshot",
    title="Product Delivery Process",
    what="For courier orders, the vendor enters a shipment method and tracking number; for pickup orders, the vendor marks the item ready and later confirms collection. The customer then confirms receipt or collection on their end.",
    who="The Vendor (dispatch) and the Customer (confirm receipt).",
    actions="Vendor: mark Shipped / Ready for Pickup. Customer: Confirm Receipt or Confirm Collection.",
    connects="Once the customer confirms, the rental becomes ACTIVE — and this is exactly where our automatic late-fee system starts watching the clock.",
    shots=["Rental detail — delivery / shipment status"],
    script="Delivery is handled differently depending on the method chosen earlier. For courier orders, the "
           "vendor records a shipment method and tracking number; for pickup orders, the vendor simply marks "
           "the item ready, and later confirms once the customer has physically collected it. From the "
           "customer's side, they confirm receipt or collection themselves. Only once that confirmation "
           "happens does the rental formally become Active — meaning the clock the customer is renting "
           "against has now started.",
    transition="This naturally leads to one of the project's most unique features — the automatic late-return system."),

# 22 -------------------------------------------------------------------------
dict(num=22, kind="screenshot",
    title="Late Return Warning System",
    what="An automatic backend check compares \"now\" to the rental's expected return date. Once overdue, the status flips to OVERDUE, a red warning badge appears showing days late, daily charge, fee deducted, and remaining deposit, and the customer is notified.",
    who="Triggered automatically by the system — visible to the Customer, the Vendor, and the Admin.",
    actions="No manual action is needed to trigger it. The customer is warned to return immediately; the vendor sees the fee accruing in real time; the admin can manually adjust the fee if a special case arises.",
    connects="Whether returned on time or late, the next step is the same — the customer initiates the return.",
    shots=["Rental detail — overdue warning badge with late fee breakdown"],
    script="This is the feature I'm most proud of in this project. Instead of vendors having to manually "
           "chase down late returns and negotiate a penalty, the backend automatically detects when a "
           "rental has passed its expected return date, flips its status to Overdue, and starts deducting a "
           "late fee straight from the held deposit — crediting it to the vendor's wallet in real time. The "
           "customer sees a clear red warning with exactly how many days late they are, the daily charge, "
           "the total fee taken so far, and what's left of their deposit. An admin retains the ability to "
           "manually adjust this fee for special cases. It completely removes the awkward, unstructured "
           "negotiation that happens in informal rentals today.",
    transition="Let's see that return process."),

# 23 -------------------------------------------------------------------------
dict(num=23, kind="screenshot",
    title="Product Return Process",
    what="The customer initiates a return (using the return method matched to how the item was originally delivered); the vendor then inspects the item and records its condition as Good or Damaged.",
    who="The Customer (initiates) and the Vendor (inspects and confirms).",
    actions="Customer: submit the return request. Vendor: confirm the returned condition.",
    connects="A \"Good\" return proceeds straight to deposit refund; a \"Damaged\" return is escalated to the Admin's damage claim queue.",
    shots=["Rental detail — return request & condition inspection"],
    script="When the customer is done with the item, they initiate a return — the system already knows the "
           "appropriate return method based on how it was delivered originally. The vendor then inspects the "
           "returned item and records its condition. If everything is fine, the rental can complete "
           "immediately. If there's damage, it doesn't get resolved on the spot — it's escalated into a "
           "formal admin review process, which we'll look at next.",
    transition="Let's look at what happens when the item comes back damaged."),

# 24 -------------------------------------------------------------------------
dict(num=24, kind="screenshot",
    title="Damage Claim System",
    what="The vendor attaches photo evidence and a claimed deduction amount; the claim is queued for Admin review, where the admin examines the evidence and finalizes the deduction — calculated separately from any late fee already collected, to avoid double-charging the customer.",
    who="The Vendor (files the claim) and the Admin (resolves it).",
    actions="Vendor: upload evidence and a description of the damage. Admin: approve, adjust, or reject the claimed deduction.",
    connects="Once resolved, the rental completes and any remaining deposit is released to the customer.",
    shots=["Admin panel — damage claim review with evidence"],
    script="Damage disputes are exactly where an informal rental arrangement usually breaks down, so we "
           "built a deliberate, evidence-based process for it. The vendor uploads photos and describes the "
           "damage along with a claimed deduction amount, and this goes into an admin review queue rather "
           "than being decided unilaterally by the vendor. One subtle but important engineering detail: if "
           "the rental was also returned late, that late fee was already automatically deducted earlier, so "
           "the admin's damage resolution is calculated on top of that without double-charging the "
           "customer.",
    transition="Which brings us to how that deposit actually gets refunded."),

# 25 -------------------------------------------------------------------------
dict(num=25, kind="screenshot",
    title="Deposit Refund System",
    what="After the return is confirmed — either immediately for a good-condition item, or after the admin resolves a damage claim — the remaining deposit (deposit minus late fee minus any approved damage deduction) is refunded to the customer, and the rental status becomes COMPLETED.",
    who="The Customer (receives the refund) and the Admin (oversees disputed cases).",
    actions="View the final refund breakdown; the rental is marked Completed.",
    connects="At the same moment, the vendor's earnings for this rental are finalized — let's look at how that's calculated.",
    shots=["Rental detail — final deposit refund breakdown"],
    script="This is the financial closing step for the customer. Whatever is left of the deposit after any "
           "late fee and any approved damage deduction is refunded, and the customer can see exactly how "
           "that final number was reached — full transparency, no surprises. At this point the rental's "
           "status is formally marked Completed. But the customer's side of the money isn't the whole "
           "picture — let's look at what the vendor and the platform each take from this transaction.",
    transition="Let's break down exactly how the platform calculates everyone's share of the money."),

# 26 -------------------------------------------------------------------------
dict(num=26, kind="screenshot",
    title="Commission Calculation",
    what="The platform automatically deducts a small commission (2%) from the rental fee; the vendor receives the remainder as a payout credited to their wallet. Late fees and approved damage deductions are credited to the vendor separately from the customer's deposit refund.",
    who="The Vendor (views payouts/wallet) and the Admin (views total commission earned platform-wide).",
    actions="Vendor: check payout history and status (Pending → Completed). Admin: monitor total commission revenue across all rentals.",
    connects="With the money settled, the rental enters its final, trust-building step — reviews.",
    shots=["Vendor payouts / wallet page", "Admin — commission overview"],
    script="Every completed rental triggers an automatic commission split. The platform takes a small two "
           "percent cut of the rental fee, and the rest is credited to the vendor's payout wallet. Crucially, "
           "any late fees or approved damage deductions are credited to the vendor on top of that, completely "
           "separate from the customer's deposit refund — so the two money flows never get mixed up. Vendors "
           "can track every payout's status, and admins can see total commission revenue across the entire "
           "platform at any time.",
    transition="Let's look at the review and rating system that closes the loop."),

# 27 -------------------------------------------------------------------------
dict(num=27, kind="screenshot",
    title="Review and Rating System",
    what="The customer rates the rental and vendor — a star rating plus written review — after completion. The vendor can reply publicly, and also privately rates the customer, making feedback mutual.",
    who="The Customer (reviews the vendor) and the Vendor (replies, and rates the customer).",
    actions="Submit a star rating and review text; vendor posts a public reply; vendor submits a private rating of the customer's behavior.",
    connects="These ratings feed directly into vendor profiles shown across the marketplace, completing the customer-facing loop.",
    shots=["Rental detail — submit review & vendor reply"],
    script="Trust doesn't end when the money is settled — it's built over time through reviews. Once a "
           "rental completes, the customer can leave a star rating and written review of the vendor, which "
           "the vendor can publicly reply to. Less commonly seen, but just as important: the vendor also "
           "privately rates the customer's behavior — were they on time, careful with the item, easy to "
           "communicate with? These ratings feed straight back into the vendor profiles customers see while "
           "browsing, which closes the trust loop for the next renter.",
    transition="Zooming out, here's how the Admin oversees the entire platform."),

# 28 -------------------------------------------------------------------------
dict(num=28, kind="screenshot",
    title="Admin Monitoring Dashboard",
    what="Platform-wide statistics — total users, vendors, products, and rentals; active, pending, and overdue counts; total commission earned; open disputes — plus quick links to manage every entity in the system.",
    who="The Admin.",
    actions="Monitor platform KPIs at a glance, drill into any list (rentals, vendors, disputes, overdue rentals), and intervene manually wherever needed.",
    connects="This dashboard is the control tower for everything we've just walked through, end to end.",
    shots=["Admin dashboard — platform-wide statistics"],
    script="This is the admin's bird's-eye view of the entire platform — total users, vendors, products, "
           "and rentals, broken down by status, alongside total commission revenue and any open disputes. "
           "From here, the admin can drill into any specific list — every rental, every vendor, every "
           "overdue case — and take direct action. Having walked through every screen a customer or vendor "
           "would see, this dashboard is effectively the control tower tying the whole system together.",
    transition="Having seen every screen, let's now look under the hood at how the data is structured."),

# 29 -------------------------------------------------------------------------
dict(num=29, kind="diagram_db",
    title="Database Design Overview",
    bullets=[
        "Around 20 normalized tables in MySQL, accessed through Prisma ORM for type-safe queries",
        "Rental acts as the central \"hub\" table connecting almost everything else",
        "User 1—1 VendorProfile  |  VendorProfile 1—N Product  |  Product 1—N Rental",
        "Rental 1—N Payment  |  Rental 1—1 ReturnRecord  |  Rental 1—N LateFeeTransaction",
        "Supporting tables: VendorPayout, Review, Dispute, Notification, and more",
    ],
    script="Underneath all of this sits a relational schema of roughly twenty normalized tables in MySQL, "
           "accessed through Prisma, which gives us fully type-safe database queries shared all the way up "
           "into the API layer. Rental is the hub table — almost everything else hangs off it: a User has "
           "one VendorProfile, which owns many Products, each of which can have many Rentals; each Rental "
           "in turn has many Payments, exactly one ReturnRecord, and potentially many LateFeeTransaction "
           "entries from our automatic fee engine. Around that hub sit supporting tables for payouts, "
           "reviews, disputes, and notifications.",
    transition="With the data model covered, let's talk about how we keep all of this secure."),

# 30 -------------------------------------------------------------------------
dict(num=30, kind="content",
    title="Security Features",
    bullets=[
        "JWT-based authentication with short-lived access tokens plus refresh tokens",
        "Passwords hashed with bcrypt — never stored in plain text",
        "Role-based authorization middleware (Customer / Vendor / Admin) enforced on every protected route",
        "Input validation on every request using Zod schemas",
        "Rate limiting and Helmet security headers; HTTPS/TLS termination via Nginx in production",
        "Strict file-upload validation (type and size) for product images and damage evidence photos",
    ],
    script="Security was treated as a first-class concern, not an afterthought. Authentication uses "
           "short-lived JWT access tokens paired with refresh tokens, and every password is hashed with "
           "bcrypt before it ever touches the database. Every protected API route runs through role-based "
           "authorization middleware, so a Customer token simply cannot call a Vendor- or Admin-only "
           "endpoint, no matter what the frontend shows. Every request body is validated against a Zod "
           "schema before it's trusted. And at the network layer, we have rate limiting, Helmet security "
           "headers, HTTPS termination through Nginx in production, and strict validation on every uploaded "
           "file.",
    transition="Let's visualize the complete workflow end-to-end before discussing what makes this project stand out."),

# 31 -------------------------------------------------------------------------
dict(num=31, kind="diagram_workflow",
    title="Project Workflow Diagram",
    steps=["Register &\nVerify", "Browse\nMarketplace", "Request\nRental", "Vendor\nApproves",
           "Pay\n(Demo bKash)", "Deliver /\nPickup", "Active\n(Late-Fee Watch)", "Return &\nInspect",
           "Refund &\nCommission", "Review &\nRating"],
    script="Putting every screen we just saw into one continuous flow: a user registers and gets verified, "
           "browses the marketplace, requests a rental, the vendor approves it, the customer pays through "
           "the demo bKash flow, the item is delivered or picked up, the rental goes active while our "
           "automatic late-fee system silently watches the due date, the item is returned and inspected, "
           "the deposit is refunded and commission is calculated, and finally both sides leave reviews. "
           "Every one of these ten steps is a real, working screen in the application — this isn't a "
           "conceptual diagram, it's exactly what we just demonstrated.",
    transition="Now, what makes Lendora different from a typical class project or a generic e-commerce clone?"),

# 32 -------------------------------------------------------------------------
dict(num=32, kind="content",
    title="Unique Features",
    bullets=[
        "Fully automatic late-fee engine — detects overdue rentals and deducts from the deposit in real time, crediting the vendor instantly",
        "Smart pickup/return address management with a one-click \"same as pickup\" shortcut",
        "Live, auditable transaction history for every late fee and payout",
        "Realistic demo payment flow that mirrors real bKash/Nagad integration patterns",
        "Three-tier admin oversight — vendors, products, disputes, overdue rentals, and manual fee adjustment",
        "Clean Architecture backend — genuinely easy to extend and test, not just academically structured",
    ],
    script="A few things set this project apart from a typical CRUD-style class project. The automatic "
           "late-fee engine is the standout — it requires zero manual intervention to detect an overdue "
           "rental, deduct the correct fee, and credit the vendor, all while keeping a full audit trail. The "
           "address management between pickup and return locations, with that one-click shortcut, is a "
           "small UX detail that genuinely matters for vendors handling many bookings. And underneath it "
           "all, the Clean Architecture backend isn't just theoretical — it made adding the entire late-fee "
           "feature, weeks after the rest of the system was built, a contained, low-risk change rather than "
           "a rewrite.",
    transition="Of course, building this wasn't without obstacles."),

# 33 -------------------------------------------------------------------------
dict(num=33, kind="content",
    title="Challenges and Solutions",
    bullets=[
        "Challenge: Preventing double-booking of the same product on overlapping dates → Solution: row-level database locking during rental creation",
        "Challenge: Avoiding double-charging when a rental is both late AND damaged → Solution: late fees are auto-deducted in real time; admin's damage review then builds only on top of that, never re-charging the late portion",
        "Challenge: Keeping the frontend and backend in sync on types and business rules → Solution: one shared TypeScript package across the monorepo as the single source of truth",
        "Challenge: No access to a live payment gateway → Solution: a realistic, fully-functional demo bKash flow",
    ],
    script="No project this size goes smoothly throughout. One real challenge was preventing two customers "
           "from booking the same item on overlapping dates — solved with row-level database locking at the "
           "moment a rental is created. A trickier one was making sure a rental that's both late and damaged "
           "doesn't get charged twice for the same money — we solved that by having the late fee deduct "
           "automatically in real time, and designing the admin's damage review to always build on top of "
           "that already-deducted amount rather than recalculating from scratch. Keeping frontend and "
           "backend types in sync was solved structurally with one shared package. And without access to a "
           "live payment gateway, we built a demo bKash flow realistic enough to demonstrate the full "
           "integration pattern.",
    transition="No system is perfect — here are the current limitations."),

# 34 -------------------------------------------------------------------------
dict(num=34, kind="content",
    title="Project Limitations",
    bullets=[
        "Payment gateway runs in demo mode — not connected to live bKash/Nagad merchant accounts",
        "Notifications are in-system only — no SMS or email integration yet",
        "Single currency (BDT) and single-language interface",
        "No native mobile app — the web UI is responsive, but not packaged as iOS/Android apps",
        "Some admin actions, like final damage deduction, still require manual human review rather than full automation",
    ],
    script="Being honest about scope: the payment gateway is in demo mode, not connected to a live bKash or "
           "Nagad merchant account — that requires business registration outside the scope of this project. "
           "Notifications currently live only inside the app, with no SMS or email channel yet. The system "
           "supports only Bangladeshi Taka and a single-language interface for now. There's no dedicated "
           "mobile app, though the web UI is fully responsive. And by design, some decisions — like the "
           "final damage deduction amount — are deliberately left to human admin judgment rather than fully "
           "automated, since that's the right call for disputed, evidence-based cases.",
    transition="These limitations directly map to our roadmap for future work."),

# 35 -------------------------------------------------------------------------
dict(num=35, kind="content",
    title="Future Improvements",
    bullets=[
        "Integrate live bKash, Nagad, and card payment gateways",
        "Add SMS and email notification channels alongside in-system alerts",
        "Native mobile apps (React Native) for customers and vendors",
        "AI-assisted dynamic pricing and damage-image detection",
        "Multi-language support (Bangla / English toggle)",
        "Real-time chat between customer and vendor",
    ],
    script="Looking ahead, the most immediate next step is replacing the demo payment flow with live "
           "gateway integrations for bKash, Nagad, and card payments. After that, SMS and email "
           "notifications would make the platform usable for people who don't have the app open constantly. "
           "Longer-term, native mobile apps using React Native, AI-assisted dynamic pricing and even "
           "automated damage detection from photos, full Bangla and English language support, and real-time "
           "chat between customers and vendors are all natural extensions of the architecture we've already "
           "built.",
    transition="To confirm the system actually works as designed, here's a summary of our testing."),

# 36 -------------------------------------------------------------------------
dict(num=36, kind="content",
    title="Testing Results",
    bullets=[
        "Manual end-to-end testing of the full rental lifecycle across all three roles",
        "API-level testing of critical endpoints (auth, rentals, payments) using Vitest and Supertest",
        "Edge-case verification — overlapping bookings rejected, late fee capped at deposit amount, no duplicate payouts",
        "Cross-browser and responsive UI testing across mobile, tablet, and desktop breakpoints",
        "Result: every core user journey completed successfully with no data inconsistency",
    ],
    script="To validate the system, we ran the complete rental lifecycle manually across all three roles "
           "repeatedly, alongside automated API-level tests for critical endpoints like authentication, "
           "rental creation, and payments using Vitest and Supertest. We specifically verified edge cases — "
           "that overlapping bookings are correctly rejected, that the late fee can never exceed the deposit "
           "amount even if an item is left out for months, and that a vendor is never paid out twice for the "
           "same rental. We also tested the responsive UI across mobile, tablet, and desktop screen sizes. "
           "Every core journey — from registration through to a refunded, reviewed rental — completed "
           "successfully with no data inconsistency.",
    transition="Bringing it all together, here's what this project achieved."),

# 37 -------------------------------------------------------------------------
dict(num=37, kind="content",
    title="Project Achievements",
    bullets=[
        "A fully functional, end-to-end multi-vendor rental platform — not a prototype",
        "Automated business logic that would normally require dedicated staff — late fees, payouts, commission",
        "Clean, scalable architecture suitable for real-world deployment",
        "A practical, localized solution for an underserved market — organized rentals in Bangladesh",
        "Hands-on mastery of full-stack development, database design, security, and system architecture",
    ],
    script="Stepping back, what we delivered is a genuinely complete, end-to-end platform — not a "
           "prototype that stops at the happy path, but a system that handles approvals, payments, "
           "deliveries, automatic late fees, damage disputes, refunds, and reviews. Logic that would "
           "normally require dedicated operations staff — calculating late fees, processing payouts, "
           "splitting commission — runs automatically. The architecture is clean enough to actually deploy "
           "and extend in the real world. And beyond the product itself, this project gave me hands-on, "
           "practical experience across the full stack — frontend, backend, database design, security, and "
           "system architecture, all working together in one cohesive build.",
    transition="Let's wrap up with a final summary."),

# 38 -------------------------------------------------------------------------
dict(num=38, kind="content",
    title="Conclusion",
    bullets=[
        "Lendora replaces an informal, trust-based rental culture with a structured, secure digital platform",
        "Every step of the rental lifecycle — registration to refund — is automated, tracked, and auditable",
        "The project demonstrates strong full-stack engineering across architecture, database design, security, and UX",
        "Built to be extensible — a solid foundation for a real product, not just an academic exercise",
    ],
    script="To conclude: Lendora takes a real, everyday problem — the lack of a trustworthy way to rent "
           "items short-term in Bangladesh — and solves it with a structured, secure, fully digital "
           "platform. Every step of the rental lifecycle, from the very first registration to the final "
           "deposit refund, is automated, tracked, and fully auditable. Beyond the product itself, this "
           "project demonstrates real engineering depth — system architecture, database design, security "
           "practices, and user experience, all working together. And because of how it's built, it's not "
           "a dead-end academic exercise — it's a genuinely solid foundation that could grow into a real "
           "product.",
    transition="Thank you — I'm happy to take your questions."),

# 39 -------------------------------------------------------------------------
dict(num=39, kind="thanks",
    title="Thank You",
    subtitle="Questions & Discussion",
    meta=["[Your Name]", "[Email / Contact]", "Lendora — Rental Marketplace"],
    script="Thank you all for your time and attention. That concludes my presentation of Lendora — a "
           "complete, automated, multi-vendor rental marketplace built for Bangladesh. I'd now be glad to "
           "take any questions you have, whether about the architecture, the business logic, or anything "
           "you'd like to see in more detail.",
    transition=""),
]
