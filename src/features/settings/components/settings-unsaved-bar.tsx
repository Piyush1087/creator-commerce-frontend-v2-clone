import { Button } from "../../../design-system/aurora";

type SettingsUnsavedBarProps = {
  visible: boolean;
  message?: string;
  onDiscard: () => void;
  onSave: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
};

export function SettingsUnsavedBar({
  visible,
  message = "Unsaved structural modifications detected",
  onDiscard,
  onSave,
  saveLabel = "Save workspace changes",
  saveDisabled = false,
}: SettingsUnsavedBarProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="settings-unsaved-bar" role="status">
      <span className="settings-unsaved-bar__message">⚠️ {message}</span>
      <div className="settings-unsaved-bar__actions">
        <Button variant="ghost" onClick={onDiscard}>
          Cancel &amp; discard changes
        </Button>
        <Button variant="primary" onClick={onSave} disabled={saveDisabled}>
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
