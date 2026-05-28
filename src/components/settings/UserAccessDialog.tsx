"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/types";
import { ALL_MODULES, canViewModule, ROLE_LABELS } from "@/lib/permissions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (updated: UserProfile) => void;
}

export function UserAccessDialog({ user, open, onOpenChange, onSaved }: Props) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [usingDefaults, setUsingDefaults] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.pagePermissions && Array.isArray(user.pagePermissions)) {
      setPermissions(user.pagePermissions);
      setUsingDefaults(false);
    } else {
      // Seed from role defaults so the admin sees the current effective state.
      const seeded = ALL_MODULES.filter((m) =>
        canViewModule(user.role, m.id, null)
      ).map((m) => m.id);
      setPermissions(seeded);
      setUsingDefaults(true);
    }
  }, [user]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof ALL_MODULES>();
    ALL_MODULES.forEach((m) => {
      const list = map.get(m.group) ?? [];
      list.push(m);
      map.set(m.group, list);
    });
    return Array.from(map.entries());
  }, []);

  const toggle = (id: string) => {
    setUsingDefaults(false);
    setPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setUsingDefaults(false);
    setPermissions(ALL_MODULES.map((m) => m.id));
  };

  const clearAll = () => {
    setUsingDefaults(false);
    setPermissions([]);
  };

  const resetToRoleDefaults = () => {
    if (!user) return;
    setUsingDefaults(true);
    setPermissions(
      ALL_MODULES.filter((m) => canViewModule(user.role, m.id, null)).map((m) => m.id)
    );
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.id), {
        // null clears the override so role defaults apply again.
        pagePermissions: usingDefaults ? null : permissions,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Access updated for ${user.displayName}`);
      onSaved?.({
        ...user,
        pagePermissions: usingDefaults ? null : permissions,
      });
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save access permissions");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Manage page access
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{user.displayName}</span>{" "}
            &middot; {ROLE_LABELS[user.role]} &middot; {user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between text-xs">
          <p className="text-muted-foreground">
            {usingDefaults ? (
              <>Using <span className="font-medium text-foreground">role defaults</span></>
            ) : (
              <>
                <span className="font-medium text-foreground">{permissions.length}</span> of{" "}
                {ALL_MODULES.length} pages enabled
              </>
            )}
          </p>
          <div className="flex gap-1.5">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={selectAll}>
              All
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearAll}>
              None
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={resetToRoleDefaults}>
              Role default
            </Button>
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto -mx-6 px-6 space-y-4">
          {grouped.map(([group, modules]) => (
            <div key={group}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {group}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {modules.map((m) => {
                  const checked = permissions.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2 text-sm cursor-pointer hover:border-primary/40 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(m.id)}
                        className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                      />
                      <span className={checked ? "text-foreground" : "text-muted-foreground"}>
                        {m.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
            ) : (
              "Save access"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
