import {
  Alert,
  Badge,
  Button,
  Card,
  Chip,
  ProgressBar,
  SelectField,
  SelectionCard,
  Tabs,
  TextField,
} from "../../design-system/aurora";

const selectOptions = [
  { label: "Instagram campaign", value: "instagram" },
  { label: "Marketplace listing", value: "marketplace" },
  { label: "Creator payout", value: "payout" },
];

const tableRows = [
  { amount: "₹24,000", channel: "Instagram", creator: "Aarav Studio" },
  { amount: "₹18,500", channel: "YouTube", creator: "Mira Creates" },
  { amount: "₹12,800", channel: "Marketplace", creator: "Brand Collab Co" },
];

export function AuroraPlayground() {
  return (
    <div className="aurora-playground">
      <section className="aurora-playground__hero">
        <div>
          <p className="aurora-playground__eyebrow">Temporary visual test</p>
          <h1>Aurora design system playground</h1>
          <p>
            This page uses mock UI only. It validates layout, sidebar behavior,
            cards, forms, buttons, chips, alerts, and data surfaces before real
            product modules are added.
          </p>
        </div>
        <div className="aurora-playground__hero-actions">
          <Button fullWidthOnMobile>Primary action</Button>
          <Button variant="outline">Outline action</Button>
        </div>
      </section>

      <section className="aurora-playground__grid aurora-playground__grid--stats">
        <Card compact eyebrow="Metric" title="Campaign Readiness">
          <p className="aurora-playground__metric">82%</p>
          <ProgressBar label="Setup progress" value={82} />
        </Card>
        <Card compact eyebrow="Health" title="Design Tokens">
          <p className="aurora-playground__metric">24</p>
          <Badge tone="success">CSS variables active</Badge>
        </Card>
        <Card compact eyebrow="Review" title="Responsive Shell">
          <p className="aurora-playground__metric">3</p>
          <Badge tone="pending">Desktop / tablet / mobile</Badge>
        </Card>
      </section>

      <section className="aurora-playground__grid">
        <Card
          action={<Badge tone="selected">Active</Badge>}
          eyebrow="Foundation"
          title="Buttons, badges, chips"
        >
          <div className="aurora-playground__stack">
            <div className="aurora-playground__row">
              <Button>Launch campaign</Button>
              <Button variant="secondary">Save draft</Button>
              <Button variant="outline">Preview</Button>
              <Button variant="ghost">Skip</Button>
              <Button variant="disabled">Disabled</Button>
            </div>
            <div className="aurora-playground__row">
              <Badge tone="success">Approved</Badge>
              <Badge tone="pending">Review</Badge>
              <Badge tone="error">Rejected</Badge>
            </div>
            <div className="aurora-playground__row">
              <Chip tone="selected">Instagram</Chip>
              <Chip tone="success">Beauty</Chip>
              <Chip tone="pending">Awaiting brief</Chip>
              <Chip tone="error">Needs fix</Chip>
            </div>
          </div>
        </Card>

        <Card eyebrow="Forms" title="Inputs and dropdowns">
          <div className="aurora-playground__form-grid">
            <TextField
              helperText="Use 48px height and 8px radius."
              label="Campaign name"
              placeholder="Summer creator launch"
            />
            <SelectField
              helperText="Native select until a richer select is needed."
              label="Campaign type"
              options={selectOptions}
            />
            <TextField
              error="Ruby red error state with light pink background."
              label="Product URL"
              placeholder="https://example.com/product"
            />
            <TextField
              label="Brief notes"
              multiline
              placeholder="Describe the creator brief..."
            />
          </div>
        </Card>

        <Card eyebrow="Selections" title="Selection cards">
          <div className="aurora-playground__selection-grid">
            <SelectionCard
              description="Selected state uses light mint surface and green border."
              icon="A"
              selected
              title="Awareness"
            />
            <SelectionCard
              description="Unselected state stays white with subtle border."
              icon="C"
              title="Conversions"
            />
            <SelectionCard
              description="Use for two to four high-value choices."
              icon="R"
              title="Retargeting"
            />
          </div>
        </Card>

        <Card eyebrow="Feedback" title="Alerts and tabs">
          <div className="aurora-playground__stack">
            <Tabs
              items={[
                { active: true, label: "Overview" },
                { label: "Details" },
                { label: "Analytics" },
              ]}
            />
            <Alert title="System ready">
              Mock visual components are loaded without backend data.
            </Alert>
            <Alert title="Validation warning" tone="warning">
              Warning surfaces use light pink, not amber backgrounds.
            </Alert>
            <Alert title="Destructive state" tone="error">
              Ruby red is reserved for errors and remove actions.
            </Alert>
          </div>
        </Card>
      </section>

      <Card eyebrow="Data display" title="Table to mobile cards">
        <div className="aurora-playground__table" role="table">
          <div className="aurora-playground__table-head" role="row">
            <span>Creator</span>
            <span>Channel</span>
            <span>Amount</span>
          </div>
          {tableRows.map((row) => (
            <div className="aurora-playground__table-row" key={row.creator}>
              <span data-label="Creator">{row.creator}</span>
              <span data-label="Channel">{row.channel}</span>
              <span data-label="Amount">{row.amount}</span>
            </div>
          ))}
        </div>
      </Card>

      <p className="aurora-ai-disclaimer">
        AI can make mistakes. Verify the results.
      </p>
    </div>
  );
}
