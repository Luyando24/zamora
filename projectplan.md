# **Zambian Hotel Management System (HMS) \- Feature Document**

## **I. Product Vision & Goals**

### **1\. The Core Problem**

Hotels and lodges in Zambia face a lack of **affordable, modern, and locally-compliant** management software. Existing solutions are either too expensive, fail to integrate key local payment methods (Mobile Money), or collapse during common infrastructure issues like **loadshedding** (power outages) and unreliable internet.

### **2\. The Solution**

Build a **Cloud-first, Offline-first, ZRA-compliant HMS** delivered as a SaaS (Software as a Service) platform. The primary value proposition is **compliance and uninterrupted operation**.

### **3\. Target User**

Hotel and Lodge Managers/Owners in Zambia (10 to 50 rooms).

---

## **II. Module 1: The Booking & Compliance Engine (B2B Core)**

### **A. Real-Time Inventory & ZRA Compliance**

| Problem Being Solved | Solution/Feature | Technical Implementation (Stack) |
| :---- | :---- | :---- |
| **P1: Tax Audits & Fines** | **Mandatory ZRA Smart Invoice Integration:** Seamlessly generates a ZRA-compliant invoice with the official **Mark ID and QR Code** upon check-out or payment. | **Vercel Edge Functions (API Route):** Serverless function acts as a secure intermediary to communicate with the ZRA Virtual Sales Data Controller (VSDC) API. Postgres stores the required ZRA metadata (TPIN, Device ID). |
| **P2: Power Outages / Loadshedding** | **Loadshedding Buffer & Receipt Queue:** The system is fully operational offline for check-ins, check-outs, and order taking. | **React/Next.js PWA & IndexedDB:** All critical transactions are stored locally (IndexedDB) with a Sync\_Status flag. Transactions are automatically sent to Supabase/Vercel when internet is restored. |
| **P3: Reconciliation Errors** | **Automated Nightly ZRA Report:** Generates a real-time tax liability snapshot (VAT, Tourism Levy, TOT) for the hotel owner/accountant. | **Postgres Functions (Supabase):** Custom database function runs nightly to aggregate sales data and format it into a ZRA-friendly daily summary report. |

---

### **B. Core Property Management**

| Problem Being Solved | Solution/Feature | Technical Implementation (Stack) |
| :---- | :---- | :---- |
| **P4: Double Bookings** | **Real-Time Inventory Grid:** A visual drag-and-drop calendar showing room statuses (Occupied, Vacant/Clean, Maintenance). | **React Frontend:** State management library (e.g., Zustand/Redux) handles the immediate UI changes; **Supabase Realtime** is used to instantly update other users (e.g., reception) when a room status changes. |
| **P5: Disconnected Staff** | **Housekeeping & Maintenance Module:** Staff use a simple mobile view (Tailwind responsive design) to update room status (e.g., from Dirty to Clean). | **Tailwind CSS & Next.js Routes:** Mobile-friendly dashboard with quick-access buttons. Relies on the **Offline-First** logic to allow updates even without connectivity. |

---

## **III. Module 2: The Direct Booking & Guest Experience (Unique Value)**

### **A. Direct Booking and Listing Pages**

| Problem Being Solved | Solution/Feature | Technical Implementation (Stack) |
| :---- | :---- | :---- |
| **P6: High OTA Commissions** | **Shareable, Commission-Free Listing Page:** A hotel-specific public URL (e.g., hms.com/book/lodge-name) where guests can view live inventory and book directly. | **Next.js Static/Server-Side Pages:** Pages are fast for SEO and sharing. Reads RoomTypes and availability from the public side of Supabase, ensuring real-time accuracy. |
| **P7: Payment Friction (Local)** | **Native Mobile Money (MoMo) Integration:** Guests can book and pay instantly using major Zambian MoMo providers. | **Vercel Serverless Function:** Securely communicates with aggregator APIs (e.g., Flutterwave/Pesapal) or direct APIs (MTN MoMo, Airtel). This function initiates a **"Push-to-Pay"** request to the customer's phone. |

---

### **B. Digital Guest Services**

| Problem Being Solved | Solution/Feature | Technical Implementation (Stack) |
| :---- | :---- | :---- |
| **P8: Inefficient Food Ordering** | **Digital QR Code Menu & Ordering:** A food/bar menu page, accessible via QR code in each room, that allows guests to place orders directly to the kitchen. | **React/Tailwind UI:** Kitchen/Bar display dashboard. The QR code URL embeds the RoomID. All orders are immediately logged to the guest's folio in the **Postgres Orders table**. |
| **P9: Billing & Folio Errors** | **Automated Folio Management:** All charges (room rate, bar order, laundry) are automatically added to the guest's digital folio (bill) and summarized at check-out. | **Postgres Schema & Transactions:** Critical database relationships ensure all services and sales are linked to the BookingID and appear on the final ZRA Smart Invoice. |

---

## **IV. Technical Architecture Summary**

The chosen stack is ideal for this project because it compartmentalizes security and complexity:

1. **Client (React/Tailwind):** Handles all UI/UX and is responsible for local data storage (IndexedDB) and initiating sync operations.  
2. **Edge/API (Next.js/Vercel Functions):** The secure gateway. This is where all sensitive external API calls (ZRA VSDC, MoMo) are handled. It provides a clean, validated API layer for the React frontend.  
3. **Database (Supabase/Postgres):** The single source of truth. Handles data integrity, real-time updates via its Realtime Engine, and securely enforces **multi-tenancy** using Row-Level Security (RLS).