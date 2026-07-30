import React from "react";
import { AlertCircle } from "lucide-react";
import { LABEL } from "@/components/ui/formPrimitiveStyles";

interface FieldProps {
  label: React.ReactNode;
  required?: boolean;
  hint?: string;
  error?: string;
  id?: string;
  children: React.ReactNode;
}

export function Field({ label, required = false, hint = undefined, error = undefined, id, children }: FieldProps): React.JSX.Element {
  const fallbackId = React.useId();
  const instanceIdSuffix = React.useId().replace(/:/g, "");
  const slugified = typeof label === "string"
    ? label.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/[-\s]+/g, "-")
    : "";
  const baseId = id || slugified || fallbackId;
  const resolvedId = `${baseId}-${instanceIdSuffix}`;
  const errorId = `${resolvedId}-error`;
  const hintId = `${resolvedId}-hint`;
  const describedBy = error ? errorId : (hint ? hintId : undefined);

  const injectIdAndName = (node: React.ReactNode): React.ReactNode => {
    if (!React.isValidElement(node)) return node;

    const props = node.props as { id?: string; name?: string; children?: React.ReactNode; "aria-invalid"?: boolean; "aria-describedby"?: string };
    const isInputLike =
      (typeof node.type === "string" && ["input", "textarea", "select"].includes(node.type)) ||
      ("onChange" in props || "onCheckedChange" in props);

    const element = node as React.ReactElement<{ id?: string; name?: string; children?: React.ReactNode; "aria-invalid"?: boolean; "aria-describedby"?: string }>;

    if (isInputLike) {
      return React.cloneElement(element, {
        id: props.id || resolvedId,
        name: props.name || baseId,
        "aria-invalid": props["aria-invalid"] ?? Boolean(error),
        "aria-describedby": props["aria-describedby"] || describedBy,
      });
    }

    if (props.children) {
      return React.cloneElement(
        element,
        {},
        React.Children.map(props.children, injectIdAndName)
      );
    }

    return node;
  };

  const enhancedChildren = React.Children.map(children, injectIdAndName);

  return (
    <div id={id ? `${id}-container` : undefined} data-field-key={id}>
      <label htmlFor={resolvedId} className={LABEL}>
        {label}
        {required && <span className="text-destructive ms-0.5" aria-hidden="true">*</span>}
      </label>
      {enhancedChildren}
      {error ? (
        <p id={errorId} role="alert" aria-live="polite" className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : (
        hint && <p id={hintId} className="text-xs text-muted-foreground mt-1">{hint}</p>
      )}
    </div>
  );
}
