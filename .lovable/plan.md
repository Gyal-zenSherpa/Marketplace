

## Plan: Admin Gold-Tier Gate and Rs Currency in Seller Dashboard

### 1. Change Currency from $ to Rs in Seller Dashboard

**File: `src/pages/SellerDashboard.tsx`**

Update three locations:
- **Line 361**: Change `Price ($)` label to `Price (Rs)`
- **Line 373**: Change `Original Price ($)` label to `Original Price (Rs)`
- **Line 553**: Change `${Number(product.price).toFixed(2)}` to `Rs ${Number(product.price).toFixed(2)}` in the product list display

### 2. Add Gold-Tier Verification for Admin Sensitive Actions

**File: `src/pages/Admin.tsx`**

After the admin role check succeeds (around line 218), add a query to the `user_loyalty` table to fetch the admin's `current_tier`. Store it in state. Then, before performing sensitive actions (role changes, order status updates, seller application approvals), check if the admin is Gold tier. If not, show a toast warning and block the action.

Sensitive actions to gate:
- Changing user roles
- Approving/rejecting seller applications
- Updating order statuses

---

### Technical Details

**Currency changes** (SellerDashboard.tsx):
- Line 361: `Price ($)` to `Price (Rs)`
- Line 373: `Original Price ($)` to `Original Price (Rs)`
- Line 553: `$` prefix to `Rs` prefix in product listing

**Gold-tier gate** (Admin.tsx):
- Add state: `const [adminTier, setAdminTier] = useState<string | null>(null);`
- After admin check, fetch tier: `supabase.from("user_loyalty").select("current_tier").eq("user_id", user.id).single()`
- Create a helper: `const requireGoldTier = () => { if (adminTier !== 'Gold') { toast warning; return false; } return true; }`
- Add `if (!requireGoldTier()) return;` at the start of role update, seller approval, and order status update handlers

