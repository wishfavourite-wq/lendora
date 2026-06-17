# -*- coding: utf-8 -*-
"""System Architecture diagram for Lendora — layered/component view from the
actual codebase: client -> Nginx -> Next.js frontend / Express backend ->
shared package -> data & external services, wrapped in the pnpm/Turborepo
monorepo boundary.
"""
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
from matplotlib.lines import Line2D
from matplotlib.patches import FancyArrowPatch

CLIENT_FILL   = "#D9E6F2"; CLIENT_EDGE   = "#3D6B8C"
PROXY_FILL    = "#F2D9A8"; PROXY_EDGE    = "#9C6E1E"
FRONTEND_FILL = "#BFD9B3"; FRONTEND_EDGE = "#3D6B35"
BACKEND_FILL  = "#A8D5C9"; BACKEND_EDGE  = "#1E6B57"
SHARED_FILL   = "#E3C6EC"; SHARED_EDGE   = "#7A3D8C"
DATA_FILL     = "#F6C453"; DATA_EDGE     = "#9C7A1E"
EXT_FILL      = "#E0B4A4"; EXT_EDGE      = "#9C5A41"
LINE_COLOR    = "#333333"
TEXT_COLOR    = "#1A1A1A"
TITLE_COLOR   = "#163A5F"

W, H = 46, 32
fig, ax = plt.subplots(figsize=(W * 0.5, H * 0.5))
ax.set_xlim(0, W)
ax.set_ylim(0, H)
ax.set_aspect('equal')
ax.axis('off')

BOXES = {}


def box(name, cx, cy, w, h, fill, edge, title, lines, fontsize_title=12.5, fontsize_body=9.2, title_color=None):
    b = FancyBboxPatch((cx - w/2, cy - h/2), w, h,
                        boxstyle="round,pad=0.03,rounding_size=0.18",
                        linewidth=1.8, edgecolor=edge, facecolor=fill, zorder=3)
    ax.add_patch(b)
    ty = cy + h/2 - 0.55
    ax.text(cx, ty, title, fontsize=fontsize_title, fontweight='bold',
            color=title_color or TEXT_COLOR, ha='center', va='center', zorder=4)
    for i, ln in enumerate(lines):
        ax.text(cx, ty - 0.62 - i * 0.5, ln, fontsize=fontsize_body, color=TEXT_COLOR,
                ha='center', va='center', zorder=4)
    BOXES[name] = (cx, cy, w, h)
    return BOXES[name]


def dashed_group(cx, cy, w, h, label):
    b = FancyBboxPatch((cx - w/2, cy - h/2), w, h, boxstyle="round,pad=0.03,rounding_size=0.25",
                        linewidth=1.6, edgecolor="#555555", facecolor='none', linestyle=(0, (7, 4)), zorder=1)
    ax.add_patch(b)
    ax.text(cx - w/2 + 0.4, cy + h/2 - 0.35, label, fontsize=10.5, fontweight='bold',
            color="#555555", ha='left', va='center', zorder=2,
            bbox=dict(boxstyle='round,pad=0.25', fc='white', ec='#555555', lw=1))


def edge_pt(name, direction):
    cx, cy, w, h = BOXES[name]
    return {'top': (cx, cy + h/2), 'bottom': (cx, cy - h/2),
            'left': (cx - w/2, cy), 'right': (cx + w/2, cy)}[direction]


def arrow(p1, p2, label=None, dashed=False, bidir=False, lw=1.6, label_frac=0.5, fontsize=9.5, curve=0.0):
    style = '<->' if bidir else '-|>'
    conn = f"arc3,rad={curve}" if curve else "arc3"
    fa = FancyArrowPatch(p1, p2, arrowstyle=style, mutation_scale=14, linewidth=lw,
                          color=LINE_COLOR, linestyle=(0, (5, 3)) if dashed else 'solid',
                          connectionstyle=conn, zorder=2)
    ax.add_patch(fa)
    if label:
        mx, my = p1[0] + (p2[0]-p1[0]) * label_frac, p1[1] + (p2[1]-p1[1]) * label_frac
        ax.text(mx, my, label, fontsize=fontsize, color=TEXT_COLOR, ha='center', va='center', zorder=5,
                bbox=dict(boxstyle='round,pad=0.18', fc='white', ec='#999999', lw=0.7))


# ──────────────────────────────── Client ────────────────────────────────────
box("client", 23, 30.4, 14, 2.0, CLIENT_FILL, CLIENT_EDGE,
    "Client Layer", ["Web Browser — Customer / Vendor / Admin (responsive UI)"])

# ──────────────────────────────── Nginx ──────────────────────────────────────
box("nginx", 23, 26.6, 20, 2.4, PROXY_FILL, PROXY_EDGE,
    "Nginx Reverse Proxy  (production)",
    ["TLS termination  ·  Rate limiting (auth/api/payment zones)",
     "Gzip compression  ·  Static asset caching"])

arrow(edge_pt("client", "bottom"), edge_pt("nginx", "top"), "HTTPS")

# ──────────────────────────────── Monorepo group ────────────────────────────
dashed_group(23, 18.4, 38, 9.0, "Monorepo — pnpm workspaces + Turborepo")

# ──────────────────────────────── Frontend ───────────────────────────────────
box("frontend", 12, 19.3, 14.5, 5.6, FRONTEND_FILL, FRONTEND_EDGE,
    "Frontend — Next.js 15",
    ["React 19  ·  App Router", "TanStack Query  ·  Zustand", "Tailwind CSS", "Port 3000"])

# ──────────────────────────────── Backend ───────────────────────────────────
box("backend", 34, 19.3, 14.5, 5.6, BACKEND_FILL, BACKEND_EDGE,
    "Backend API — Express",
    ["Clean Architecture", "JWT Auth  ·  Zod Validation", "(layers detailed in companion diagram)", "Port 4000"])

arrow(edge_pt("nginx", "bottom"), (12, 26.0), curve=-0.05)
arrow(edge_pt("nginx", "bottom"), (34, 26.0), curve=0.05)
arrow((12 + 7.25 + 0.1, 19.3 + 1.2), (34 - 7.25 - 0.1, 19.3 + 1.2), "REST / JSON\n(TanStack Query)", bidir=True)

# ──────────────────────────────── Shared package ─────────────────────────────
box("shared", 23, 14.3, 13, 2.3, SHARED_FILL, SHARED_EDGE,
    "@lendora/shared",
    ["Types · Enums · Zod Schemas · Business Constants"])

arrow((12 - 1.0, 19.3 - 2.8), (23 - 2.0, 14.3 + 1.15), dashed=True, lw=1.2)
arrow((34 + 1.0, 19.3 - 2.8), (23 + 2.0, 14.3 + 1.15), dashed=True, lw=1.2)

# ──────────────────────────────── Data & external services ─────────────────
services = [
    ("mysql",   "MySQL 8",          ["via Prisma ORM"],            DATA_FILL, DATA_EDGE),
    ("redis",   "Redis Cache",      ["in-memory fallback"],        DATA_FILL, DATA_EDGE),
    ("bkash",   "bKash Gateway",    ["Tokenized Checkout"],        EXT_FILL,  EXT_EDGE),
    ("nagad",   "Nagad Gateway",    ["Merchant API"],               EXT_FILL,  EXT_EDGE),
    ("smtp",    "SMTP Email",       ["Nodemailer"],                 EXT_FILL,  EXT_EDGE),
    ("storage", "File Storage",     ["product images, evidence"],   EXT_FILL,  EXT_EDGE),
]
n = len(services)
sw, gap = 6.2, 0.55
start_x = 23 - (n * sw + (n - 1) * gap) / 2 + sw / 2
for i, (key, title, lines, fill, edge) in enumerate(services):
    cx = start_x + i * (sw + gap)
    box(key, cx, 9.0, sw, 2.6, fill, edge, title, lines, fontsize_title=10.5, fontsize_body=8.6)
    arrow(edge_pt("backend", "bottom"), edge_pt(key, "top"), lw=1.3, curve=(cx - 34) * 0.01)

# ─────────────────────────────────── Legend ──────────────────────────────────
lx, ly = 0.6, 0.6
lw_, lh_ = 9.4, 6.6
ax.add_patch(FancyBboxPatch((lx, ly), lw_, lh_, boxstyle="round,pad=0.04,rounding_size=0.15",
                             linewidth=1.2, edgecolor="#555555", facecolor='white', zorder=5))
ax.text(lx + 0.35, ly + lh_ - 0.5, "Legend", fontsize=13, fontweight='bold', color=TEXT_COLOR, zorder=6)
legend_rows = [
    (CLIENT_FILL, CLIENT_EDGE, "Client"), (PROXY_FILL, PROXY_EDGE, "Reverse Proxy"),
    (FRONTEND_FILL, FRONTEND_EDGE, "Frontend"), (BACKEND_FILL, BACKEND_EDGE, "Backend API"),
    (SHARED_FILL, SHARED_EDGE, "Shared Package"), (DATA_FILL, DATA_EDGE, "Data Store"),
    (EXT_FILL, EXT_EDGE, "External Service"),
]
for i, (fill, edge, label) in enumerate(legend_rows):
    yy = ly + lh_ - 1.15 - i * 0.68
    ax.add_patch(FancyBboxPatch((lx + 0.35, yy - 0.18), 0.85, 0.36, boxstyle="round,pad=0.02,rounding_size=0.06",
                                 linewidth=1.2, edgecolor=edge, facecolor=fill, zorder=6))
    ax.text(lx + 1.5, yy, label, fontsize=10.5, color=TEXT_COLOR, va='center', zorder=6)

ax.add_line(Line2D([lx + 0.35, lx + 1.2], [ly + 0.85, ly + 0.85], color=LINE_COLOR, linewidth=1.6, zorder=6))
ax.text(lx + 1.5, ly + 0.85, "Runtime call", fontsize=10, color=TEXT_COLOR, va='center', zorder=6)
ax.add_line(Line2D([lx + 0.35, lx + 1.2], [ly + 0.42, ly + 0.42], color=LINE_COLOR, linewidth=1.2,
                    linestyle=(0, (5, 3)), zorder=6))
ax.text(lx + 1.5, ly + 0.42, "Shared types (compile-time)", fontsize=10, color=TEXT_COLOR, va='center', zorder=6)

# ─────────────────────────────────── Title ────────────────────────────────────
ax.text(W/2 + 4.3, 0.65, "System Architecture — Lendora Rental Marketplace", fontsize=19, fontweight='bold',
        color=TITLE_COLOR, ha='center', zorder=6)

plt.tight_layout()
fig.savefig("Lendora_System_Architecture.png", dpi=180, bbox_inches='tight', facecolor='white')
fig.savefig("Lendora_System_Architecture.pdf", bbox_inches='tight', facecolor='white')
print("Saved Lendora_System_Architecture.png and .pdf")
