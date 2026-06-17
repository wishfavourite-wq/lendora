# -*- coding: utf-8 -*-
"""Generates an editable draw.io (.drawio) file mirroring the exact layout of
Lendora_ER_Diagram.png — same entity positions, attribute fans, relationship
diamonds and cardinalities, so it opens as a ready-to-edit version of the
same diagram in app.diagrams.net or the desktop draw.io app.
"""
import xml.sax.saxutils as su

SCALE = 42
CANVAS_H = 36

cells = []
_counter = [0]


def new_id(prefix):
    _counter[0] += 1
    return f"{prefix}{_counter[0]}"


def box_px(cx, cy, w, h):
    left = (cx - w / 2) * SCALE
    top = (CANVAS_H - (cy + h / 2)) * SCALE
    return left, top, w * SCALE, h * SCALE


def pt_px(x, y):
    return x * SCALE, (CANVAS_H - y) * SCALE


ENTITY_STYLE = ("rounded=1;whiteSpace=wrap;html=1;fillColor=#BFD9B3;strokeColor=#3D6B35;"
                "fontStyle=1;fontSize=13;arcSize=14;")
ATTR_STYLE = "ellipse;whiteSpace=wrap;html=1;fillColor=#C9DCEE;strokeColor=#2F5C8A;fontSize=11;"
ATTR_KEY_STYLE = ATTR_STYLE + "fontStyle=4;"
ATTR_MV_RING_STYLE = "ellipse;html=1;fillColor=none;strokeColor=#2F5C8A;"
REL_STYLE = "rhombus;whiteSpace=wrap;html=1;fillColor=#F6C453;strokeColor=#9C7A1E;fontStyle=1;fontSize=10;"
EDGE_STYLE = "edgeStyle=none;rounded=0;html=1;endArrow=none;startArrow=none;strokeColor=#333333;"
EDGE_ELBOW_STYLE = ("edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=none;"
                     "startArrow=none;strokeColor=#333333;")

ENTITIES = {}  # name -> (id, cx, cy, w, h)


def add_entity(name, x, y, w=3.0, h=1.15):
    eid = new_id("ent")
    l, t, pw, ph = box_px(x, y, w, h)
    cells.append(f'<mxCell id="{eid}" value="{su.escape(name)}" style="{ENTITY_STYLE}" '
                  f'vertex="1" parent="1"><mxGeometry x="{l:.1f}" y="{t:.1f}" '
                  f'width="{pw:.1f}" height="{ph:.1f}" as="geometry"/></mxCell>')
    ENTITIES[name] = (eid, x, y, w, h)
    return eid


def edge_point(name, direction):
    _, cx, cy, w, h = ENTITIES[name]
    return {'top': (cx, cy + h/2), 'bottom': (cx, cy - h/2),
            'left': (cx - w/2, cy), 'right': (cx + w/2, cy)}[direction]


def add_attribute_for(entity_name, attr_name, idx, total, side, spread, dist=1.05, key=False, mv=False):
    _, ecx, ecy, ew, eh = ENTITIES[entity_name]
    if side in ('top', 'bottom'):
        ax = ecx if total == 1 else ecx + (idx - (total - 1) / 2) * (spread / (total - 1))
        ay = ecy + eh/2 + dist if side == 'top' else ecy - eh/2 - dist
        anchor = (ax, ecy + eh/2) if side == 'top' else (ax, ecy - eh/2)
    else:
        ay = ecy if total == 1 else ecy + (idx - (total - 1) / 2) * (spread / (total - 1))
        ax = ecx + ew/2 + dist if side == 'right' else ecx - ew/2 - dist
        anchor = (ecx + ew/2, ay) if side == 'right' else (ecx - ew/2, ay)

    aid = new_id("attr")
    l, t, pw, ph = box_px(ax, ay, 1.55, 0.62)
    style = ATTR_KEY_STYLE if key else ATTR_STYLE
    cells.append(f'<mxCell id="{aid}" value="{su.escape(attr_name)}" style="{style}" '
                  f'vertex="1" parent="1"><mxGeometry x="{l:.1f}" y="{t:.1f}" '
                  f'width="{pw:.1f}" height="{ph:.1f}" as="geometry"/></mxCell>')
    if mv:
        rl, rt, rpw, rph = box_px(ax, ay, 1.55 - 0.18, 0.62 - 0.18)
        cells.append(f'<mxCell id="{new_id("mv")}" value="" style="{ATTR_MV_RING_STYLE}" '
                      f'vertex="1" parent="1"><mxGeometry x="{rl:.1f}" y="{rt:.1f}" '
                      f'width="{rpw:.1f}" height="{rph:.1f}" as="geometry"/></mxCell>')

    eid = new_id("edge")
    cells.append(f'<mxCell id="{eid}" style="{EDGE_STYLE}" edge="1" parent="1" '
                  f'source="{ENTITIES[entity_name][0]}" target="{aid}">'
                  f'<mxGeometry relative="1" as="geometry"/></mxCell>')
    return aid


def fan(entity_name, attrs, side, spread, dist=1.05):
    for i, (nm, key, mv) in enumerate(attrs):
        add_attribute_for(entity_name, nm, i, len(attrs), side, spread, dist, key=key, mv=mv)


def add_cardinality_label(edge_id, text, pos):
    """pos: -1 (near source) .. 1 (near target)."""
    lid = new_id("lbl")
    cells.append(f'<mxCell id="{lid}" value="{text}" style="text;html=1;align=center;'
                  f'verticalAlign=middle;fontSize=11;fontColor=#1A1A1A;labelBackgroundColor=#ffffff;" '
                  f'vertex="1" connectable="0" parent="{edge_id}">'
                  f'<mxGeometry x="{pos:.2f}" relative="1" as="geometry">'
                  f'<mxPoint as="offset"/></mxGeometry></mxCell>')


def link(e1, dir1, e2, dir2, label, card1, card2, via=None):
    p1 = edge_point(e1, dir1)
    p2 = edge_point(e2, dir2)
    pts = [p1] + (via or []) + [p2]
    mid_idx = len(pts) // 2 - 1 if len(pts) > 2 else 0
    m1, m2 = pts[mid_idx], pts[mid_idx + 1]
    dcx, dcy = (m1[0] + m2[0]) / 2, (m1[1] + m2[1]) / 2

    did = new_id("rel")
    dw, dh = 1.9, 1.0
    l, t, pw, ph = box_px(dcx, dcy, dw, dh)
    cells.append(f'<mxCell id="{did}" value="{su.escape(label)}" style="{REL_STYLE}" '
                  f'vertex="1" parent="1"><mxGeometry x="{l:.1f}" y="{t:.1f}" '
                  f'width="{pw:.1f}" height="{ph:.1f}" as="geometry"/></mxCell>')

    # entity1 -> diamond (carries card1, plus any waypoints up to the diamond)
    pre_pts = pts[:mid_idx + 1]
    e1id = new_id("edge")
    style = EDGE_ELBOW_STYLE if len(pre_pts) > 1 else EDGE_STYLE
    waypoints = ""
    if len(pre_pts) > 1:
        wp = "".join(f'<mxPoint x="{pt_px(*p)[0]:.1f}" y="{pt_px(*p)[1]:.1f}"/>' for p in pre_pts[1:])
        waypoints = f'<Array as="points">{wp}</Array>'
    cells.append(f'<mxCell id="{e1id}" style="{style}" edge="1" parent="1" '
                  f'source="{ENTITIES[e1][0]}" target="{did}">'
                  f'<mxGeometry relative="1" as="geometry">{waypoints}</mxGeometry></mxCell>')
    add_cardinality_label(e1id, card1, -0.7)

    # diamond -> entity2 (carries card2, plus any remaining waypoints)
    post_pts = pts[mid_idx + 1:]
    e2id = new_id("edge")
    style = EDGE_ELBOW_STYLE if len(post_pts) > 1 else EDGE_STYLE
    waypoints = ""
    if len(post_pts) > 1:
        wp = "".join(f'<mxPoint x="{pt_px(*p)[0]:.1f}" y="{pt_px(*p)[1]:.1f}"/>' for p in post_pts[:-1])
        waypoints = f'<Array as="points">{wp}</Array>'
    cells.append(f'<mxCell id="{e2id}" style="{style}" edge="1" parent="1" '
                  f'source="{did}" target="{ENTITIES[e2][0]}">'
                  f'<mxGeometry relative="1" as="geometry">{waypoints}</mxGeometry></mxCell>')
    add_cardinality_label(e2id, card2, 0.7)


# ════════════════════════════ ROW A — top actors ═══════════════════════════
add_entity("Admin", 8, 31, w=2.6)
add_entity("Seller", 16, 31, w=2.6)
add_entity("Category", 25, 31, w=2.8)
add_entity("ProductImage", 33, 31, w=3.2)

fan("Admin",  [("adminId", True, False), ("name", False, False), ("email", False, False)], 'top', 3.0)
fan("Seller", [("sellerId", True, False), ("name", False, False), ("phone", False, False),
               ("status", False, False)], 'top', 4.2)
fan("Category", [("categoryId", True, False), ("name", False, False), ("slug", False, False)], 'top', 3.0)
fan("ProductImage", [("imageId", True, False), ("imageUrl", False, False),
                      ("isPrimary", False, False)], 'top', 3.0)

# ════════════════════════ ROW B — verification / shop / product ═══════════
add_entity("Verification", 12, 23.5, w=3.0)
add_entity("Shop", 19, 23.5, w=2.4)
add_entity("Product", 28, 23.5, w=2.6)

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
add_entity("Customer", 8, 16, w=2.8)
add_entity("RentalRequest", 19, 16, w=3.4)
add_entity("RentalOrder", 36, 16, w=3.2)
add_entity("ReturnRequest", 52, 16, w=3.4)

fan("Customer", [("customerId", True, False), ("name", False, False), ("phone", False, False)],
    'left', 2.6, dist=1.4)
fan("RentalRequest", [("requestId", True, False), ("startDate", False, False),
                       ("endDate", False, False)], 'bottom', 3.0)
fan("RentalOrder", [("orderId", True, False)], 'top', 0, dist=1.3)
fan("ReturnRequest", [("returnId", True, False), ("returnDate", False, False),
                       ("condition", False, False)], 'bottom', 3.0)

link("Customer", 'top', "Verification", 'bottom', "Submits", "1", "N")
link("Customer", 'right', "RentalRequest", 'left', "Creates", "1", "N")
link("Product", 'bottom', "RentalRequest", 'top', "Requested For", "1", "N")
link("RentalRequest", 'right', "RentalOrder", 'left', "Approved As", "1", "1")
link("RentalOrder", 'right', "ReturnRequest", 'left', "Initiates", "1", "1")
link("Seller", 'bottom', "RentalOrder", 'top', "Fulfills", "1", "N",
     via=[(16, 20), (36, 20)])

# ════════════════════════ ROW C — financial / logistics outcomes ══════════
add_entity("WalletTransaction", 13, 8, w=3.6)
add_entity("Payment", 24, 8, w=2.6)
add_entity("SecurityDeposit", 30, 8, w=3.2)
add_entity("DeliveryInfo", 36, 8, w=3.0)
add_entity("LateFeeRecord", 42, 8, w=3.0)
add_entity("PlatformCommission", 49, 8, w=3.8)
add_entity("OrderStatusHistory", 56, 8, w=3.6)

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
add_entity("DepositRefund", 30, 1.4, w=3.2)
add_entity("DamageClaim", 52, 1.4, w=3.0)
add_entity("Review", 14, 1.4, w=2.4)
add_entity("Notification", 23, 1.4, w=3.0)

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

# ───────────────────────────── Legend (as plain shapes, fully editable) ────
lx, ly = 0.5, 24.0
cells.append(f'<mxCell id="{new_id("leg")}" value="Legend" style="rounded=1;whiteSpace=wrap;html=1;'
             f'fillColor=#ffffff;strokeColor=#555555;verticalAlign=top;align=left;spacingLeft=10;'
             f'spacingTop=8;fontSize=14;fontStyle=1;" vertex="1" parent="1">'
             f'<mxGeometry x="{lx*SCALE:.1f}" y="{(CANVAS_H-(ly+8.6))*SCALE:.1f}" '
             f'width="{6.4*SCALE:.1f}" height="{8.6*SCALE:.1f}" as="geometry"/></mxCell>')

legend_rows = [
    ("Entity", ENTITY_STYLE), ("Attribute", ATTR_STYLE),
    ("Key Attribute (underlined)", ATTR_KEY_STYLE),
    ("Relationship", REL_STYLE),
]
for i, (label, style) in enumerate(legend_rows):
    yy = ly + 5.6 - i * 1.5
    swid, shei = (1.0, 0.5) if "rhombus" not in style and "rounded" not in style else (1.1, 0.55)
    l, t, pw, ph = box_px(lx + 1.1, yy, 1.1, 0.5)
    cells.append(f'<mxCell id="{new_id("legitem")}" value="" style="{style}" vertex="1" parent="1">'
                 f'<mxGeometry x="{l:.1f}" y="{t:.1f}" width="{pw:.1f}" height="{ph:.1f}" as="geometry"/></mxCell>')
    lt, tt, pwt, pht = box_px(lx + 3.9, yy, 4.6, 0.5)
    cells.append(f'<mxCell id="{new_id("legtxt")}" value="{su.escape(label)}" '
                 f'style="text;html=1;align=left;verticalAlign=middle;fontSize=12;" vertex="1" parent="1">'
                 f'<mxGeometry x="{lt:.1f}" y="{tt:.1f}" width="{pwt:.1f}" height="{pht:.1f}" as="geometry"/></mxCell>')

note_l, note_t, note_w, note_h = box_px(lx + 3.15, ly + 0.9, 5.6, 1.6)
cells.append(f'<mxCell id="{new_id("note")}" value="Cardinality (1/N) labelled on both ends of each line. '
             f'Multivalued attribute = Product.tags (mark with a double border manually if needed)." '
             f'style="text;html=1;align=left;verticalAlign=middle;fontSize=10;fontColor=#555555;'
             f'fontStyle=2;whiteSpace=wrap;" vertex="1" parent="1">'
             f'<mxGeometry x="{note_l:.1f}" y="{note_t:.1f}" width="{note_w:.1f}" height="{note_h:.1f}" '
             f'as="geometry"/></mxCell>')

# ───────────────────────────── Title ────────────────────────────────────────
tl, tt, tw, th = box_px(33, 0.6, 20, 1.0)
cells.append(f'<mxCell id="{new_id("title")}" value="ER Diagram — Lendora Rental Marketplace" '
             f'style="text;html=1;align=center;verticalAlign=middle;fontSize=18;fontStyle=1;'
             f'fontColor=#163A5F;" vertex="1" parent="1">'
             f'<mxGeometry x="{tl:.1f}" y="{tt:.1f}" width="{tw:.1f}" height="{th:.1f}" as="geometry"/></mxCell>')

# ───────────────────────────── Assemble XML ─────────────────────────────────
xml_doc = f'''<mxfile host="app.diagrams.net">
  <diagram name="Lendora ER Diagram">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1"
        arrows="1" fold="1" page="1" pageScale="1" pageWidth="2520" pageHeight="1512" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        {''.join(cells)}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
'''

with open("Lendora_ER_Diagram.drawio", "w", encoding="utf-8") as f:
    f.write(xml_doc)

print(f"Saved Lendora_ER_Diagram.drawio with {len(cells)} cells")
