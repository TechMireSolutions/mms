export function normalizeOption(value: string): string {
  return value.trim().toLowerCase();
}

export function isOptionSelected(values: string[], option: string): boolean {
  const normalized = normalizeOption(option);
  return values.some((v) => normalizeOption(v) === normalized);
}

export function toggleSelectedValue(values: string[], option: string): string[] {
  if (isOptionSelected(values, option)) {
    const normalized = normalizeOption(option);
    return values.filter((v) => normalizeOption(v) !== normalized);
  }
  return [...values, option];
}

export function removeSelectedValue(values: string[], valToRemove: string): string[] {
  return values.filter((v) => v !== valToRemove);
}

export function filterOptionsByQuery(options: string[], searchQuery: string): string[] {
  const query = searchQuery.trim().toLowerCase();
  return options
    .filter((opt) => opt.toLowerCase().includes(query))
    .sort((a, b) => a.localeCompare(b));
}

export function removeOptionFromCatalog(
  options: string[],
  values: string[],
  option: string,
): { nextOptions: string[]; nextValues: string[] } {
  const normalized = normalizeOption(option);
  return {
    nextOptions: options.filter((opt) => normalizeOption(opt) !== normalized),
    nextValues: values.filter((v) => normalizeOption(v) !== normalized),
  };
}

function titleCaseWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function titleCaseSegment(segment: string): string {
  return segment
    .split(" ")
    .map(titleCaseWord)
    .join(" ");
}

export interface AddTagsResult {
  nextValues: string[];
  nextOptions: string[];
  optionsChanged: boolean;
}

export function buildAddedTags(
  rawText: string,
  options: string[],
  values: string[],
  canUpdateOptions: boolean,
): AddTagsResult {
  const parts = rawText
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  let nextValues = [...values];
  let nextOptions = [...options];
  let optionsChanged = false;

  for (const part of parts) {
    const text = titleCaseSegment(part);
    const normalized = normalizeOption(text);

    const existingInOptions = nextOptions.find((opt) => normalizeOption(opt) === normalized);
    const existingInValues = nextValues.some((val) => normalizeOption(val) === normalized);

    if (!existingInOptions && canUpdateOptions) {
      nextOptions = [...nextOptions, text];
      optionsChanged = true;
    }
    if (!existingInValues) {
      nextValues = [...nextValues, existingInOptions || text];
    }
  }

  return { nextValues, nextOptions, optionsChanged };
}
