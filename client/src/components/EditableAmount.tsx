import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface EditableAmountProps {
  value: string;
  label: string;
  onSave: (value: string) => Promise<void>;
  dataTestId?: string;
}

export default function EditableAmount({ value, label, onSave, dataTestId }: EditableAmountProps) {
  const [open, setOpen] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editValue);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setEditValue(value);
          setOpen(true);
        }}
        className="text-left hover-elevate active-elevate-2 rounded-md transition-colors"
        data-testid={dataTestId}
      >
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold text-primary">
          NT$ {parseFloat(value || "0").toLocaleString()}
        </p>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改{label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">金額</Label>
              <Input
                id="amount"
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="0"
                data-testid={`input-edit-${dataTestId}`}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
                disabled={saving}
              >
                取消
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1"
                disabled={saving}
                data-testid={`button-save-${dataTestId}`}
              >
                {saving ? "儲存中..." : "儲存"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
