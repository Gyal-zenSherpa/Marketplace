

## Responsive Fixes for Seller Dashboard & Admin Pages

### Issues Identified

All four sections share the same problems on mobile:

1. **Card headers** use `flex items-center justify-between` with fixed-width search inputs (`w-64`) that overflow on small screens
2. **Tables** have too many columns for mobile, causing horizontal overflow without proper scroll
3. **Seller Dashboard** title row and product cards don't stack properly on small screens
4. **Admin page** header and stats grid are fine, but the TabsList with 10 tabs needs better mobile wrapping

### Plan

**1. Admin Orders Tab (`AdminOrdersTab.tsx`)**
- Stack the card header vertically on mobile: title block on top, search + filter below (`flex-col md:flex-row`)
- Make search input full-width on mobile (`w-full md:w-64`)
- Wrap the table in `overflow-x-auto` for horizontal scroll
- Hide less critical columns (Payment, Date) on mobile using `hidden md:table-cell`
- In order detail dialog, stack the 2-column grids to single column on mobile (`grid-cols-1 md:grid-cols-2`)

**2. Admin Users Tab (`AdminUsersTab.tsx`)**
- Same header fix: stack vertically on mobile
- Search input full-width on mobile
- Hide User ID column on mobile (`hidden md:table-cell`)
- Wrap table in `overflow-x-auto`

**3. Admin Audit Tab (`AdminAuditTab.tsx`)**
- Same header fix
- Hide IP Address column on mobile
- Wrap table in `overflow-x-auto`

**4. Seller Dashboard (`SellerDashboard.tsx`)**
- Make title responsive (`text-2xl md:text-3xl`)
- Product list cards: stack image, info, and actions vertically on mobile instead of horizontal flex
- Make the product action buttons row on mobile

**5. Admin Page Layout (`Admin.tsx`)**
- Stats cards already use `grid-cols-1 md:grid-cols-4` -- good
- The TabsList already has `flex-wrap` -- verify it scrolls properly; add `overflow-x-auto` if needed

**6. Header & Footer**
- Header already handles mobile with Sheet menu -- no changes needed
- Footer is already responsive -- no changes needed

### Files to Edit
- `src/components/admin/AdminOrdersTab.tsx`
- `src/components/admin/AdminUsersTab.tsx`
- `src/components/admin/AdminAuditTab.tsx`
- `src/pages/SellerDashboard.tsx`
- `src/pages/Admin.tsx` (minor TabsList adjustment)

