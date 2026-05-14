export type TabItem = {
  active?: boolean;
  label: string;
};

type TabsProps = {
  items: TabItem[];
};

export function Tabs({ items }: TabsProps) {
  return (
    <div className="aurora-tabs" role="tablist">
      {items.map((item) => (
        <button
          className={item.active ? "aurora-tab aurora-tab--active" : "aurora-tab"}
          key={item.label}
          role="tab"
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
