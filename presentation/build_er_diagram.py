# -*- coding: utf-8 -*-
"""Chen-notation ER diagram for Lendora — full 22-entity model.
Horizontal spine (Customer -> RentalRequest -> RentalOrder -> ReturnRequest)
with related entities above/below. Relationship diamonds are computed directly
from each connector's path midpoint, so they can never drift off the line.
"""
import matplotlib.pyplot as plt
from matplotlib.patches import Ellipse, FancyBboxPatch
from matplotlib.lines import Line2D

ENTITY_FILL = "#BFD9B3"
ENTITY_EDGE = "#3D6B35"
ATTR_FILL   = "#C9DCEE"
ATTR_EDGE   = "#2F5C8A"
REL_FILL    = "#F6C453"
REL_EDGE    = "#9C7A1E"
LINE_COLOR  = "#333333"
TEXT_COLOR  = "#1A1A1A"
TITLE_COLOR = "#163A5F"

W, H = 60, 36
fig, ax = plt.subplots(figsize=(W * 0.62, H * 0.62))
ax.set_xlim(0, W)
ax.set_ylim(0, H)
ax.set_aspect('equal')
ax.axis('off')

ENTITIES = {}  # name -> (cx, cy, w, h)


def entity(name, cx, cy, w=3.0, h=1.15, fontsize=12.5):
    box = FancyBboxPatch((cx - w/2, cy - h/2), w, h,
                          boxstyle="round,pad=0.02,rounding_size=0.07",
                          linewidth=1.6, edgecolor=ENTITY_EDGE, facecolor=ENTITY_FILL, zorder=3)
    ax.add_patch(box)
    ax.text(cx, cy, name, fontsize=fontsize, fontweight='bold', color=TEXT_COLOR,
             ha='center', va='center', zorder=4)
    ENTITIES[name] = (cx, cy, w, h)
    return ENTITIES[name]


def edge_point(name, direction):
    """Return the point on an entity's bounding box in the given compass direction."""
    cx, cy, w, h = ENTITIES[name]
    return {
        'top': (cx, cy + h/2), 'bottom': (cx, cy - h/2),
        'left': (cx - w/2, cy), 'right': (cx + w/2, cy),
    }[direction]


def relationship_diamond(label, cx, cy, w=1.9, h=1.0, fontsize=9.0):
    pts = [(cx, cy + h/2), (cx + w/2, cy), (cx, cy - h/2), (cx - w/2, cy)]
    poly = plt.Polygon(pts, closed=True, linewidth=1.4, edgecolor=REL_EDGE, facecolor=REL_FILL, zorder=3)
    ax.add_patch(poly)
    for i, ln in enumerate(label.split("\n")):
        ax.text(cx, cy + (0.16 if len(label.split(chr(10))) > 1 and i == 0 else
                          -0.16 if len(label.split(chr(10))) > 1 else 0),
                ln, fontsize=fontsize, fontweight='bold', color=TEXT_COLOR, ha='center', va='center', zorder=4)


def link(e1, dir1, e2, dir2, label, card1, card2, via=None, diamond_w=1.9, diamond_h=1.0, fontsize_card=9.5):
    """Connects entity e1 -> e2 (optionally through waypoints `via`), drawing the
    full line, a relationship diamond centered on the middle segment, and the
    1/N cardinality labels at each end."""
    p1 = edge_point(e1, dir1)
    p2 = edge_point(e2, dir2)
    pts = [p1] + (via or []) + [p2]

    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    ax.add_line(Line2D(xs, ys, color=LINE_COLOR, linewidth=1.2, zorder=1))

    # cardinality near each end
    a, b = pts[0], pts[1]
    ax.text(a[0] + (b[0]-a[0])*0.16, a[1] + (b[1]-a[1])*0.16, card1, fontsize=fontsize_card,
            color=TEXT_COLOR, ha='center', va='center', zorder=4,
            bbox=dict(boxstyle='round,pad=0.05', fc='white', ec='none'))
    a, b = pts[-2], pts[-1]
    ax.text(a[0] + (b[0]-a[0])*0.16, a[1] + (b[1]-a[1])*0.16, card2, fontsize=fontsize_card,
            color=TEXT_COLOR, ha='center', va='center', zorder=4,
            bbox=dict(boxstyle='round,pad=0.05', fc='white', ec='none'))

    # diamond on the geometric midpoint of the *middle* segment (or only segment)
    mid_idx = len(pts) // 2 - 1 if len(pts) > 2 else 0
    m1, m2 = pts[mid_idx], pts[mid_idx + 1]
    dcx, dcy = (m1[0] + m2[0]) / 2, (m1[1] + m2[1]) / 2
    relationship_diamond(label, dcx, dcy, w=diamond_w, h=diamond_h)


def attribute(name, cx, cy, key=False, multivalued=False, w=1.55, h=0.62, fontsize=9.2):
    e = Ellipse((cx, cy), w, h, linewidth=1.25, edgecolor=ATTR_EDGE, facecolor=ATTR_FILL, zorder=3)
    ax.add_patch(e)
    if multivalued:
        ax.add_patch(Ellipse((cx, cy), w - 0.18, h - 0.18, linewidth=1.0, edgecolor=ATTR_EDGE,
                              facecolor='none', zorder=3))
    ax.text(cx, cy + (0.06 if key else 0), name, fontsize=fontsize, color=TEXT_COLOR,
            ha='center', va='center', zorder=4)
    if key:
        half = len(name) * 0.039 * (fontsize / 9.2)
        ax.plot([cx - half, cx + half], [cy - 0.105, cy - 0.105], color=TEXT_COLOR, linewidth=1.0, zorder=4)
    return (cx, cy)


def attach(p1, p2):
    ax.add_line(Line2D([p1[0], p2[0]], [p1[1], p2[1]], color=LINE_COLOR, linewidth=0.9, zorder=1))


def fan(name, attrs, side, spread, dist=1.05):
    ecx, ecy, ew, eh = ENTITIES[name]
    n = len(attrs)
    if side in ('top', 'bottom'):
        xs = [ecx] if n == 1 else [ecx + (i - (n-1)/2) * (spread/(n-1)) for i in range(n)]
        y = ecy + eh/2 + dist if side == 'top' else ecy - eh/2 - dist
        ay = ecy + eh/2 if side == 'top' else ecy - eh/2
        for x, (nm, key, mv) in zip(xs, attrs):
            p = attribute(nm, x, y, key=key, multivalued=mv)
            attach((x, ay), p)
    else:
        ys = [ecy] if n == 1 else [ecy + (i - (n-1)/2) * (spread/(n-1)) for i in range(n)]
        x = ecx + ew/2 + dist if side == 'right' else ecx - ew/2 - dist
        ax_ = ecx + ew/2 if side == 'right' else ecx - ew/2
        for y, (nm, key, mv) in zip(ys, attrs):
            p = attribute(nm, x, y, key=key, multivalued=mv)
            attach((ax_, y), p)


# ════════════════════════════ ROW A — top actors ═══════════════════════════
entity("Admin", 8, 31, w=2.6)
entity("Seller", 16, 31, w=2.6)
entity("Category", 25, 31, w=2.8)
entity("ProductImage", 33, 31, w=3.2)

fan("Admin",  [("adminId", True, False), ("name", False, False), ("email", False, False)], 'top', 3.0)
fan("Seller", [("sellerId", True, False), ("name", False, False), ("phone", False, False),
               ("status", False, False)], 'top', 4.2)
fan("Category", [("categoryId", True, False), ("name", False, False), ("slug", False, False)], 'top', 3.0)
fan("ProductImage", [("imageId", True, False), ("imageUrl", False, False),
                      ("isPrimary", False, False)], 'top', 3.0)

# ════════════════════════ ROW B — verification / shop / product ═══════════
entity("Verification", 12, 23.5, w=3.0)
entity("Shop", 19, 23.5, w=2.4)
entity("Product", 28, 23.5, w=2.6)

fan("Verification", [("verificationId", True, False), ("documentType", False, False),
                      ("status", False, False)], 'right', 2.2, dist=1.5)
fan("Shop", [("shopId", True, False), ("shopName", False, False),
             ("district", False, False)], 'bottom', 2.8)
fan("Product", [("productId", True, False), ("name", False, False), ("pricePerDay", False, False),
                ("depositAmount", False, False), ("tags", False, True)], 'right', 4.6, dist=1.8)

link("Admin", 'bottom', "Verification", 'top', "Reviews", "1", "N")
link("Seller", 'bottom', "Verification", 'top', "Submits", "1", "N")
link("Seller", 'bottom', "Shop", 'top', "Owns", "1", "1")
link("Shop", 'right', "Product", 'left', "Lists", "1", "N")
link("Category", 'bottom', "Product", 'top', "Classifies", "1", "N")
link("Product", 'right', "ProductImage", 'bottom', "Has", "1", "N")

# ════════════════════════════ SPINE ════════════════════════════════════════
entity("Customer", 8, 16, w=2.8)
entity("RentalRequest", 19, 16, w=3.4)
entity("RentalOrder", 36, 16, w=3.2)
entity("ReturnRequest", 52, 16, w=3.4)

fan("Customer", [("customerId", True, False), ("name", False, False), ("phone", False, False)],
    'left', 2.6, dist=1.4)
fan("RentalRequest", [("requestId", True, False), ("startDate", False, False),
                       ("endDate", False, False)], 'bottom', 3.0)
fan("RentalOrder", [("orderId", True, False)], 'top', 0, dist=1.3)
fan("ReturnRequest", [("returnId", True, False), ("returnDate", False, False),
                       ("condition", False, False)], 'bottom', 3.0)

link("Customer", 'top', "Verification", 'bottom', "Submits", "1", "N")
link("Customer", 'right', "RentalRequest", 'left', "Creates", "1", "N")
link("Product", 'bottom', "RentalRequest", 'top', "Requested\nFor", "1", "N", diamond_h=1.15)
link("RentalRequest", 'right', "RentalOrder", 'left', "Approved\nAs", "1", "1", diamond_h=1.15)
link("RentalOrder", 'right', "ReturnRequest", 'left', "Initiates", "1", "1")
link("Seller", 'bottom', "RentalOrder", 'top', "Fulfills", "1", "N",
     via=[(16, 20), (36, 20)])

# ════════════════════════ ROW C — financial / logistics outcomes ══════════
entity("WalletTransaction", 13, 8, w=3.6)
entity("Payment", 24, 8, w=2.6)
entity("SecurityDeposit", 30, 8, w=3.2)
entity("DeliveryInfo", 36, 8, w=3.0)
entity("LateFeeRecord", 42, 8, w=3.0)
entity("PlatformCommission", 49, 8, w=3.8)
entity("OrderStatusHistory", 56, 8, w=3.6)

fan("WalletTransaction", [("transactionId", True, False), ("amount", False, False),
                           ("type", False, False)], 'bottom', 3.0)
fan("Payment", [("paymentId", True, False), ("amount", False, False),
                ("method", False, False)], 'bottom', 3.0)
fan("SecurityDeposit", [("depositId", True, False), ("amount", False, False),
                         ("status", False, False)], 'bottom', 3.0)
fan("DeliveryInfo", [("deliveryId", True, False), ("method", False, False),
                      ("trackingNumber", False, False)], 'bottom', 3.0)
fan("LateFeeRecord", [("lateFeeId", True, False), ("lateDays", False, False),
                       ("amount", False, False)], 'bottom', 3.0)
fan("PlatformCommission", [("commissionId", True, False), ("rate", False, False),
                            ("amount", False, False)], 'bottom', 3.0)
fan("OrderStatusHistory", [("historyId", True, False), ("status", False, False),
                            ("changedAt", False, False)], 'bottom', 3.0)

link("Seller", 'bottom', "WalletTransaction", 'top', "Earns", "1", "N",
     via=[(16, 20), (13, 11)])
link("RentalOrder", 'bottom', "Payment", 'top', "Has", "1", "N")
link("RentalOrder", 'bottom', "SecurityDeposit", 'top', "Has", "1", "1")
link("RentalOrder", 'bottom', "DeliveryInfo", 'top', "Has", "1", "1")
link("RentalOrder", 'bottom', "LateFeeRecord", 'top', "Generates", "1", "N",
     via=[(36, 11), (42, 11)])
link("RentalOrder", 'bottom', "PlatformCommission", 'top', "Generates", "1", "1",
     via=[(36, 12.6), (49, 12.6)])
link("RentalOrder", 'bottom', "OrderStatusHistory", 'top', "Logs", "1", "N",
     via=[(36, 14.2), (56, 14.2)])

# ════════════════════════════ ROW D — second-order outcomes ═══════════════
entity("DepositRefund", 30, 1.4, w=3.2)
entity("DamageClaim", 52, 1.4, w=3.0)
entity("Review", 14, 1.4, w=2.4)
entity("Notification", 23, 1.4, w=3.0)

fan("DepositRefund", [("refundId", True, False), ("amount", False, False),
                       ("refundedAt", False, False)], 'bottom', 3.0)
fan("DamageClaim", [("claimId", True, False), ("claimedAmount", False, False),
                     ("status", False, False)], 'bottom', 3.0)
fan("Review", [("reviewId", True, False), ("rating", False, False),
                ("comment", False, False)], 'left', 2.4, dist=1.3)
fan("Notification", [("notificationId", True, False), ("type", False, False),
                      ("isRead", False, False)], 'bottom', 3.0)

link("SecurityDeposit", 'bottom', "DepositRefund", 'top', "ResultsIn", "1", "1")
link("ReturnRequest", 'bottom', "DamageClaim", 'top', "Raises", "1", "1")
link("RentalOrder", 'bottom', "Review", 'top', "Receives", "1", "1",
     via=[(36, 5), (14, 5)])
link("Customer", 'bottom', "Review", 'right', "Writes", "1", "N",
     via=[(8, 5)])
link("Customer", 'bottom', "Notification", 'top', "Receives", "1", "N",
     via=[(8, 4), (23, 4)])
link("Seller", 'bottom', "Notification", 'top', "Receives", "1", "N",
     via=[(16, 20), (16, 6), (23, 6)])

# ───────────────────────────── Legend ───────────────────────────────────────
lx, ly = 0.5, 24.0
lw, lh = 6.4, 8.6
ax.add_patch(FancyBboxPatch((lx, ly), lw, lh, boxstyle="round,pad=0.02", linewidth=1.2,
                             edgecolor="#555555", facecolor="white", zorder=5))
ax.text(lx + 0.3, ly + lh - 0.6, "Legend", fontsize=15, fontweight='bold', color=TEXT_COLOR, zorder=6)

legend_items = [
    ("entity", "Entity"), ("attr", "Attribute"), ("key", "Key Attribute (underlined)"),
    ("mv", "Multivalued Attribute"), ("rel", "Relationship"),
]
ly0 = ly + lh - 1.6
for i, (kind, label) in enumerate(legend_items):
    yy = ly0 - i * 0.95
    cx0 = lx + 0.7
    if kind == "entity":
        ax.add_patch(FancyBboxPatch((cx0 - 0.4, yy - 0.17), 0.8, 0.34, boxstyle="round,pad=0.01",
                                     linewidth=1.2, edgecolor=ENTITY_EDGE, facecolor=ENTITY_FILL, zorder=6))
    elif kind == "rel":
        pts = [(cx0, yy + 0.22), (cx0 + 0.38, yy), (cx0, yy - 0.22), (cx0 - 0.38, yy)]
        ax.add_patch(plt.Polygon(pts, closed=True, linewidth=1.2, edgecolor=REL_EDGE, facecolor=REL_FILL, zorder=6))
    else:
        ax.add_patch(Ellipse((cx0, yy), 0.82, 0.36, linewidth=1.2, edgecolor=ATTR_EDGE,
                              facecolor=ATTR_FILL, zorder=6))
        if kind == 'mv':
            ax.add_patch(Ellipse((cx0, yy), 0.60, 0.22, linewidth=1.0, edgecolor=ATTR_EDGE,
                                  facecolor='none', zorder=6))
        if kind == 'key':
            ax.plot([cx0 - 0.22, cx0 + 0.22], [yy - 0.13, yy - 0.13], color=TEXT_COLOR, linewidth=1.1, zorder=6)
    ax.text(lx + 1.5, yy, label, fontsize=12.5, color=TEXT_COLOR, va='center', zorder=6)

ax.text(lx + 0.3, ly + 0.5,
        "Cardinality (1 / N) is shown on\nboth ends of every connecting line.\n"
        "Bent lines are long-distance links\nrouted clear of unrelated attributes.",
        fontsize=10.5, color="#555555", style='italic', zorder=6)

# ───────────────────────────── Title ────────────────────────────────────────
ax.text(W/2 + 3, 0.4, "ER Diagram — Lendora Rental Marketplace", fontsize=22, fontweight='bold',
        color=TITLE_COLOR, ha='center', zorder=6)

plt.tight_layout()
fig.savefig("Lendora_ER_Diagram.png", dpi=170, bbox_inches='tight', facecolor='white')
fig.savefig("Lendora_ER_Diagram.pdf", bbox_inches='tight', facecolor='white')
print("Saved Lendora_ER_Diagram.png and .pdf")
