import React from "react";
import { AlertCircle } from "lucide-react";
import { LABEL } from "@/components/ui/formPrimitiveStyles";
import { FORM_ERROR } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: React.ReactNode;
  required?: boolean;
  hint?: string;
  error?: string;
  id?: string;
  children: React.ReactNode;
}

/** Inline field validation message — use for errors outside `<Field>`. */
export function FieldErrorMessage({
  message,
  id,
  className,
}: {
  message?: string;
  id?: string;
  className?: string;
}): React.JSX.Element | null {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className={cn(FORM_ERROR, "font-medium flex items-center gap-1", className)}
    >
      <AlertCircle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

interface InputLikeProps {
  id?: string;
  name?: string;
  children?: React.ReactNode;
  onChange?: unknown;
  onCheckedChange?: unknown;
}

function findFirstInputLike(node: React.ReactNode): InputLikeProps | undefined {
  if (!React.isValidElement(node)) return undefined;

  const props = node.props as InputLikeProps;
  const isNativeInput =
    typeof node.type === "string" && ["input", "textarea", "select"].includes(node.type);
  const isCustomControl =
    typeof node.type !== "string" &&
    (props.id !== undefined ||
      props.name !== undefined ||
      "onChange" in props ||
      "onCheckedChange" in props);
  const isInputLike = isNativeInput || isCustomControl;

  if (isInputLike) return props;

  for (const child of React.Children.toArray(props.children)) {
    const inputLike = findFirstInputLike(child);
    if (inputLike) return inputLike;
  }

  return undefined;
}

export function RequiredMark(): React.JSX.Element {
  return <span className="text-destructive ms-0.5" aria-hidden="true">*</span>;
}

export function Field({ label, required = false, hint = undefined, error = undefined, id, children }: FieldProps): React.JSX.Element {
  const fallbackId = React.useId();
  const instanceIdSuffix = React.useId().replace(/:/g, "");
  const slugified = typeof label === "string"
    ? label.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/[-\s]+/g, "-")
    : "";
  const baseId = id || slugified || fallbackId;
  const existingControl = React.Children.toArray(children)
    .map(findFirstInputLike)
    .find(Boolean);
  const resolvedId = id || existingControl?.id || `${baseId}-${instanceIdSuffix}`;
  const resolvedName = existingControl?.name || id || baseId;
  const errorId = `${resolvedId}-error`;
  const hintId = `${resolvedId}-hint`;
  const describedBy = error ? errorId : (hint ? hintId : undefined);

  let injectedCount = 0;
  const injectIdAndName = (node: React.ReactNode): React.ReactNode => {
    if (!React.isValidElement(node)) return node;

    const props = node.props as { id?: string; name?: string; children?: React.ReactNode; "aria-invalid"?: boolean; "aria-describedby"?: string };
    const isNativeInput =
      typeof node.type === "string" && ["input", "textarea", "select"].includes(node.type);
    const isInputLike =
      isNativeInput ||
      ("onChange" in props || "onCheckedChange" in props);

    const element = node as React.ReactElement<{ id?: string; name?: string; children?: React.ReactNode; "aria-invalid"?: boolean; "aria-describedby"?: string }>;

    if (isInputLike) {
      const assignedId = props.id || (injectedCount === 0 ? resolvedId : `${resolvedId}-${injectedCount}`);
      const assignedName = props.name || (injectedCount === 0 ? resolvedName : `${resolvedName}-${injectedCount}`);
      injectedCount++;
      return React.cloneElement(element, {
        id: assignedId,
        name: assignedName,
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
        {required && <RequiredMark />}
      </label>
      {enhancedChildren}
      {error ? (
        <FieldErrorMessage message={error} id={errorId} />
      ) : (
        hint && <p id={hintId} className="text-xs text-muted-foreground mt-1">{hint}</p>
      )}
    </div>
  );
}
