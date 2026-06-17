# -*- coding: utf-8 -*-
"""Clean Architecture companion diagram — the classic Robert C. Martin
concentric-circle view, annotated with Lendora's actual folders/classes at
each ring, plus the Dependency Rule (outer rings depend inward, never out).
"""
import math
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyBboxPatch, FancyArrowPatch

RING_COLORS = ["#F6C453", "#BFD9B3", "#E0B4A4", "#C9DCEE"]   # innermost -> outermost
RING_EDGES  = ["#9C7A1E", "#3D6B35", "#9C5A41", "#2F5C8A"]
TEXT_COLOR  = "#1A1A1A"
TITLE_COLOR = "#163A5F"
LINE_COLOR  = "#333333"

CX, CY = 12.5, 13.5
RADII = [2.25, 4.5, 6.75, 9.0]   # outer radius of each ring, innermost first
RING_LABELS = ["Domain\n(Entities)", "Application\n(Use Cases)", "Interface\nAdapters", "Frameworks\n& Drivers"]

W, H = 40, 27
fig, ax = plt.subplots(figsize=(W * 0.46, H * 0.46))
ax.set_xlim(0, W)
ax.set_ylim(0, H)
ax.set_aspect('equal')
ax.axis('off')

# draw rings outermost-first so each smaller circle paints over the previous
for i in reversed(range(4)):
    ax.add_patch(Circle((CX, CY), RADII[i], facecolor=RING_COLORS[i], edgecolor=RING_EDGES[i],
                         linewidth=1.8, zorder=2 + (4 - i)))

# ring labels, placed at a consistent angle within each ring band
label_angle = math.radians(200)
prev_r = 0
for i, r in enumerate(RADII):
    mid_r = (prev_r + r) / 2
    lx = CX + mid_r * math.cos(label_angle)
    ly = CY + mid_r * math.sin(label_angle)
    ax.text(lx, ly, RING_LABELS[i], fontsize=9.3 if i < 2 else 9.8, fontweight='bold',
            color=TEXT_COLOR, ha='center', va='center', zorder=10, linespacing=1.3)
    prev_r = r

# dependency-rule arrow, curving inward along the bottom of the circle
arr = FancyArrowPatch((CX + 6.6, CY - 6.6), (CX - 1.2, CY - 2.3),
                       connectionstyle="arc3,rad=-0.35", arrowstyle='-|>', mutation_scale=18,
                       linewidth=2.0, color="#7A1E1E", zorder=11)
ax.add_patch(arr)
ax.text(CX + 4.3, CY - 8.0, "Dependency Rule:\nouter layers depend inward — never the reverse",
        fontsize=9.5, color="#7A1E1E", fontweight='bold', ha='center', va='center', zorder=11)

# ─────────────────────────── Callouts with real Lendora classes ────────────
callouts = [
    ("Frameworks & Drivers", RING_COLORS[3], RING_EDGES[3], 3,
     ["Express.js, Prisma Client, MySQL", "Redis (ioredis), Next.js / React",
      "bKash & Nagad gateway SDKs"]),
    ("Interface Adapters", RING_COLORS[2], RING_EDGES[2], 2,
     ["interface/http/routes/*.ts (controllers)", "Middleware: authenticate, validate, error-handler",
      "PrismaXRepository classes", "BkashGateway, NagadGateway adapters"]),
    ("Application (Use Cases)", RING_COLORS[1], RING_EDGES[1], 1,
     ["ConfirmRentalUseCase, InitiateReturnUseCase", "ProcessVendorPayoutUseCase, ReleaseDepositUseCase",
      "Ports: IRentalRepository, IPaymentGateway"]),
    ("Domain", RING_COLORS[0], RING_EDGES[0], 0,
     ["Entities & types (@lendora/shared)", "Domain Events: RentalConfirmedEvent",
      "DomainError, ProductUnavailableError"]),
]

callout_x = 27.5
callout_ys = [22.7, 16.6, 9.9, 3.4]
callout_w, callout_h = 15.6, [3.0, 3.6, 3.0, 3.0]

angle_for_ring = math.radians(35)
for (title, fill, edge, ring_idx, lines), cy_box, h_box in zip(callouts, callout_ys, callout_h):
    prev_r = RADII[ring_idx - 1] if ring_idx > 0 else 0
    mid_r = (prev_r + RADII[ring_idx]) / 2
    sx = CX + mid_r * math.cos(angle_for_ring)
    sy = CY + mid_r * math.sin(angle_for_ring)
    bx = callout_x - callout_w/2
    ax.add_line(plt.Line2D([sx, bx], [sy, cy_box], color=LINE_COLOR, linewidth=1.1, zorder=5))

    box_ = FancyBboxPatch((bx, cy_box - h_box/2), callout_w, h_box,
                           boxstyle="round,pad=0.03,rounding_size=0.16",
                           linewidth=1.6, edgecolor=edge, facecolor='white', zorder=6)
    ax.add_patch(box_)
    strip = FancyBboxPatch((bx, cy_box + h_box/2 - 0.62), callout_w, 0.62,
                            boxstyle="round,pad=0.0,rounding_size=0.16",
                            linewidth=0, edgecolor='none', facecolor=fill, zorder=7)
    ax.add_patch(strip)
    ax.text(callout_x, cy_box + h_box/2 - 0.31, title, fontsize=11, fontweight='bold',
            color=TEXT_COLOR, ha='center', va='center', zorder=8)
    for j, ln in enumerate(lines):
        ax.text(callout_x, cy_box + h_box/2 - 1.05 - j * 0.5, ln, fontsize=8.8, color=TEXT_COLOR,
                ha='center', va='center', zorder=8)

# ─────────────────────────────────── Title ────────────────────────────────────
ax.text(W/2, 0.9, "Clean Architecture — Lendora Backend (apps/api)", fontsize=18, fontweight='bold',
        color=TITLE_COLOR, ha='center', zorder=8)

plt.tight_layout()
fig.savefig("Lendora_Clean_Architecture.png", dpi=180, bbox_inches='tight', facecolor='white')
fig.savefig("Lendora_Clean_Architecture.pdf", bbox_inches='tight', facecolor='white')
print("Saved Lendora_Clean_Architecture.png and .pdf")
