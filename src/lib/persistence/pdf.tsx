import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import type { Repo } from "@/lib/schemas/plan";

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: "#1a1a1a",
  },
  coverPage: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 60,
    color: "#1a1a1a",
    justifyContent: "center",
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: "#15803d",
  },
  coverSubtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 40,
  },
  coverMeta: {
    fontSize: 10,
    color: "#777",
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 3,
    marginBottom: 8,
    color: "#15803d",
  },
  subsectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    marginTop: 8,
    color: "#333",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
  },
  cell: {
    flex: 1,
    paddingRight: 6,
  },
  cellBold: {
    flex: 1,
    paddingRight: 6,
    fontFamily: "Helvetica-Bold",
  },
  label: {
    fontFamily: "Helvetica-Bold",
    marginRight: 4,
    minWidth: 90,
  },
  value: {
    flex: 1,
    color: "#333",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  badge: {
    backgroundColor: "#dcfce7",
    color: "#15803d",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    fontSize: 8,
    marginRight: 4,
  },
  badgeAlt: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    fontSize: 8,
    marginRight: 4,
  },
  checkRow: {
    flexDirection: "row",
    marginBottom: 3,
    alignItems: "flex-start",
  },
  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: "#666",
    marginRight: 6,
    marginTop: 1,
  },
  checkboxFilled: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: "#15803d",
    backgroundColor: "#dcfce7",
    marginRight: 6,
    marginTop: 1,
  },
  backPage: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 60,
    color: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  backTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: "#15803d",
    textAlign: "center",
  },
  backText: {
    fontSize: 10,
    color: "#555",
    textAlign: "center",
    marginBottom: 4,
  },
});

// ── Age helper ────────────────────────────────────────────────────────────────

function calcAge(birthDate?: string): string {
  if (!birthDate) return "";
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} yrs`;
}

// ── Document component ────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
function EmergencyPlanDocument({ repo }: { repo: Repo }) {
  const { plan, plan_yaml } = repo;
  const planName = plan_yaml.name || "Family Emergency Plan";
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const members = plan.household.members;
  const tiers = plan.communication.tiers;
  const { safe_rooms, meeting_points, evacuation_routes } = plan.logistics;
  const { go_bag, medications, home_supplies } = plan.inventory;

  return (
    <Document title={planName} author="Family Prepared">
      {/* ── Cover page ── */}
      <Page size="LETTER" style={styles.coverPage}>
        <View>
          <Text style={styles.coverTitle}>{planName}</Text>
          <Text style={styles.coverSubtitle}>Emergency Preparedness Binder</Text>
          <Text style={styles.coverMeta}>Generated: {today}</Text>
          {members.length > 0 && (
            <Text style={styles.coverMeta}>
              Household: {members.map((m) => m.name).join(", ")}
            </Text>
          )}
          <Text style={{ ...styles.coverMeta, marginTop: 40, color: "#bbb" }}>
            Keep this document with your emergency kit and at a secure off-site location.
          </Text>
        </View>
      </Page>

      {/* ── Household + Communications ── */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Household Members</Text>
          {members.length === 0 ? (
            <Text style={{ color: "#999" }}>No members added.</Text>
          ) : (
            members.map((m) => (
              <View key={m.id} style={{ marginBottom: 8 }}>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Name:</Text>
                  <Text style={styles.value}>{m.name}</Text>
                  {m.birth_date && (
                    <Text style={{ ...styles.value, color: "#666" }}>
                      Age: {calcAge(m.birth_date)}
                    </Text>
                  )}
                </View>
                {m.dietary && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Dietary:</Text>
                    <Text style={styles.value}>{m.dietary}</Text>
                  </View>
                )}
                {m.medical && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Medical:</Text>
                    <Text style={styles.value}>{m.medical}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Communication Plan (PACE)</Text>
          {tiers.length === 0 ? (
            <Text style={{ color: "#999" }}>No communication plan configured.</Text>
          ) : (
            tiers.map((tier) => (
              <View key={tier.tier} style={{ marginBottom: 10 }}>
                <Text style={styles.subsectionTitle}>
                  {tier.tier.charAt(0).toUpperCase() + tier.tier.slice(1)}
                </Text>
                {tier.protocol_notes ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Protocol:</Text>
                    <Text style={styles.value}>{tier.protocol_notes}</Text>
                  </View>
                ) : null}
                {tier.contacts.map((c) => (
                  <View key={c.id} style={styles.row}>
                    <Text style={styles.cellBold}>{c.name}</Text>
                    <Text style={styles.cell}>{c.role}</Text>
                    <Text style={styles.cell}>{c.channel}: {c.value}</Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
      </Page>

      {/* ── Logistics ── */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logistics</Text>

          <Text style={styles.subsectionTitle}>Safe Rooms</Text>
          {safe_rooms.length === 0 ? (
            <Text style={{ color: "#999" }}>None configured.</Text>
          ) : (
            safe_rooms.map((r) => (
              <View key={r.id} style={styles.infoRow}>
                <Text style={styles.label}>{r.location}</Text>
                {r.notes && <Text style={styles.value}>{r.notes}</Text>}
              </View>
            ))
          )}

          <Text style={styles.subsectionTitle}>Meeting Points</Text>
          {meeting_points.length === 0 ? (
            <Text style={{ color: "#999" }}>None configured.</Text>
          ) : (
            meeting_points.map((mp) => (
              <View key={mp.id} style={{ marginBottom: 4 }}>
                <View style={styles.infoRow}>
                  <Text style={mp.type === "primary" ? styles.badge : styles.badgeAlt}>
                    {mp.type}
                  </Text>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>{mp.description}</Text>
                </View>
                {mp.address && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Address:</Text>
                    <Text style={styles.value}>{mp.address}</Text>
                  </View>
                )}
              </View>
            ))
          )}

          <Text style={styles.subsectionTitle}>Evacuation Routes</Text>
          {evacuation_routes.length === 0 ? (
            <Text style={{ color: "#999" }}>None configured.</Text>
          ) : (
            evacuation_routes.map((r) => (
              <View key={r.id} style={styles.infoRow}>
                <Text style={styles.label}>{r.name}</Text>
                {r.notes && <Text style={styles.value}>{r.notes}</Text>}
              </View>
            ))
          )}
        </View>
      </Page>

      {/* ── Inventory ── */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resource Inventory</Text>

          <Text style={styles.subsectionTitle}>Home Supplies</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Water stored:</Text>
            <Text style={styles.value}>{home_supplies.water_gallons} gallons</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Food supply:</Text>
            <Text style={styles.value}>{home_supplies.food_days} days</Text>
          </View>
          {home_supplies.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Notes:</Text>
              <Text style={styles.value}>{home_supplies.notes}</Text>
            </View>
          )}

          <Text style={styles.subsectionTitle}>Medications</Text>
          {medications.length === 0 ? (
            <Text style={{ color: "#999" }}>None recorded.</Text>
          ) : (
            medications.map((med) => (
              <View key={med.id} style={{ marginBottom: 4 }}>
                <View style={styles.infoRow}>
                  <Text style={styles.cellBold}>{med.name}</Text>
                  {med.dose && <Text style={styles.cell}>Dose: {med.dose}</Text>}
                  {med.who && <Text style={styles.cell}>For: {med.who}</Text>}
                </View>
                {(med.frequency || med.expiration) && (
                  <View style={styles.infoRow}>
                    {med.frequency && (
                      <>
                        <Text style={styles.label}>Frequency:</Text>
                        <Text style={styles.value}>{med.frequency}</Text>
                      </>
                    )}
                    {med.expiration && (
                      <>
                        <Text style={styles.label}>Expires:</Text>
                        <Text style={styles.value}>{med.expiration}</Text>
                      </>
                    )}
                  </View>
                )}
              </View>
            ))
          )}

          <Text style={styles.subsectionTitle}>Go-Bag Checklist</Text>
          {go_bag.length === 0 ? (
            <Text style={{ color: "#999" }}>No items added.</Text>
          ) : (
            go_bag.map((item) => (
              <View key={item.id} style={styles.checkRow}>
                <View style={item.checked ? styles.checkboxFilled : styles.checkbox} />
                <Text>{item.label}</Text>
              </View>
            ))
          )}
        </View>
      </Page>

      {/* ── Back page ── */}
      <Page size="LETTER" style={styles.backPage}>
        <Text style={styles.backTitle}>Keep this binder safe.</Text>
        <Text style={styles.backText}>Store one copy with your emergency kit.</Text>
        <Text style={styles.backText}>Store a second copy at a trusted off-site location.</Text>
        <Text style={styles.backText}>Review and update at least once per year.</Text>
        <Text style={{ ...styles.backText, marginTop: 20, color: "#bbb", fontSize: 8 }}>
          Generated by Family Prepared
        </Text>
      </Page>
    </Document>
  );
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function exportPdf(repo: Repo): Promise<Blob> {
  const doc = <EmergencyPlanDocument repo={repo} />;
  return pdf(doc).toBlob();
}
