import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, ChevronUp,
  DollarSign, TrendingDown, RefreshCw, BookOpen,
  Building2, Zap, Package, Home, UserCheck, Heart, Plus, Upload
} from "lucide-react";
import { generateJERef, Account, JournalEntry, FiscalYear } from '@/lib/data/accountingData';
import { DatePicker } from "../ui/DatePicker";
import Modal from "../ui/Modal";
import { FORM_INPUT, FORM_LABEL } from "../ui/formStyles";

// ── Transaction Type Definitions ──────────────────────────────────────────────

interface QuickActionType {
  id: string;
  label: string;
  icon: React.ElementType;
  debitAcc: string;
  creditAcc: string;
  tag: string;
  description: string;
  group?: string;
  color?: string;
}

interface TransactionGroup {
  group: string;
  color: "emerald" | "red" | "blue";
  icon: React.ElementType;
  items: QuickActionType[];
}

const TRANSACTION_TYPES: TransactionGroup[] = [
  {
    group: "Money In",
    color: "emerald",
    icon: DollarSign,
    items: [
      { id: "fee_collection",  label: "Student Fee Collection", icon: BookOpen,    debitAcc: "a1000", creditAcc: "a4000", tag: "Fees",     description: "Fee received from student" },
      { id: "donation",        label: "Donation Received",       icon: Heart,       debitAcc: "a1000", creditAcc: "a4100", tag: "Donation", description: "Donation received" },
      { id: "rent_income",     label: "Rent Income",             icon: Home,        debitAcc: "a1000", creditAcc: "a4300", tag: "Capital",  description: "Rent income received" },
      { id: "other_income",    label: "Other Income",            icon: Plus,        debitAcc: "a1000", creditAcc: "a4400", tag: "Capital",  description: "Other income received" },
    ],
  },
  {
    group: "Money Out",
    color: "red",
    icon: TrendingDown,
    items: [
      { id: "salary",          label: "Salary Payment",          icon: UserCheck,   debitAcc: "a5000", creditAcc: "a1010", tag: "Payroll",   description: "Staff salary paid" },
      { id: "utilities",       label: "Utilities",               icon: Zap,         debitAcc: "a5200", creditAcc: "a1000", tag: "Utilities", description: "Utility bill paid" },
      { id: "supplies",        label: "Supplies / Expense",      icon: Package,     debitAcc: "a5300", creditAcc: "a1000", tag: "Capital",   description: "Supplies purchased" },
      { id: "rent_payment",    label: "Rent Payment",            icon: Building2,   debitAcc: "a5100", creditAcc: "a1010", tag: "Rent",      description: "Rent paid" },
      { id: "other_expense",   label: "Other Expense",           icon: TrendingDown,debitAcc: "a5700", creditAcc: "a1000", tag: "Capital",   description: "Other expense paid" },
    ],
  },
  {
    group: "Transfers",
    color: "blue",
    icon: RefreshCw,
    items: [
      { id: "transfer",        label: "Move Funds Between Accounts", icon: RefreshCw, debitAcc: "a1020", creditAcc: "a1010", tag: "Adjustment", description: "Internal funds transfer" },
      { id: "adjustment",      label: "Adjustment / Correction",     icon: Plus,      debitAcc: "a1000", creditAcc: "a1000", tag: "Adjustment", description: "Adjustment entry" },
    ],
  },
];

const ALL_TYPES = TRANSACTION_TYPES.flatMap((g) => g.items);

// Account display names (friendly)
const ACCOUNT_LABELS: Record<string, string> = {
  "a1000": "Cash in Hand",
  "a1010": "Bank (HBL)",
  "a1020": "Bank (Meezan)",
  "a1100": "Accounts Receivable",
  "a4000": "Fee Income",
  "a4100": "Donation Income",
  "a4200": "Obligation Income",
  "a4300": "Grant Income",
  "a4400": "Other Income",
  "a5000": "Staff Salaries",
  "a5100": "Rent Expense",
  "a5200": "Utilities",
  "a5300": "Printing & Supplies",
  "a5400": "Maintenance",
  "a5700": "Miscellaneous Expense",
};

const CASH_ACCOUNTS = [
  { id: "a1000", label: "Cash in Hand" },
  { id: "a1010", label: "Bank (HBL)" },
  { id: "a1020", label: "Bank (Meezan)" },
];

const GROUP_COLORS: Record<string, Record<string, string>> = {
  emerald: {
    card: "border-success/30 bg-success/10/60 hover:bg-success/10",
    header: "bg-success/15 text-success border-success/30",
    badge: "bg-success/15 text-success",
    item: "border-success/30 hover:border-success hover:bg-success/10",
    selected: "border-success bg-success/10 ring-2 ring-success/30",
    icon: "text-success bg-success/15",
  },
  red: {
    card: "border-destructive/30 bg-destructive/10/60 hover:bg-destructive/10",
    header: "bg-destructive/15 text-destructive border-destructive/30",
    badge: "bg-destructive/15 text-destructive",
    item: "border-destructive/30 hover:border-destructive hover:bg-destructive/10",
    selected: "border-destructive bg-destructive/10 ring-2 ring-destructive/20",
    icon: "text-destructive bg-destructive/15",
  },
  blue: {
    card: "border-info/30 bg-info/10/60 hover:bg-info/10",
    header: "bg-info/15 text-info border-info/30",
    badge: "bg-info/15 text-info",
    item: "border-info/30 hover:border-info hover:bg-info/10",
    selected: "border-info bg-info/10 ring-2 ring-info/30",
    icon: "text-info bg-info/15",
  },
};


interface WizardFormState {
  date: string;
  amount: string;
  debitAcc: string;
  creditAcc: string;
  description: string;
  ref: string;
  receipt: string;
  fiscal_year: string;
}

// ── Step 1: Type Selection ──────────────────────────────────────────────────
function StepTypeSelection({ selected, onSelect }: { selected: QuickActionType | null, onSelect: (type: QuickActionType) => void }) {
  return (
    <div className="space-y-5">
      <header className="text-center space-y-1 pb-2">
        <h3 className="text-lg font-bold text-foreground m-0">What happened?</h3>
        <p className="text-sm text-muted-foreground m-0">Choose the type of transaction</p>
      </header>
      {TRANSACTION_TYPES.map((group) => {
        const colors = GROUP_COLORS[group.color];
        const GroupIcon = group.icon;
        return (
          <article key={group.group} className={`rounded-2xl border p-4 ${colors.card}`}>
            <header className={`flex items-center gap-2 mb-3 px-2 py-1.5 rounded-lg border w-fit ${colors.header}`}>
              <GroupIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <h4 className="text-xs font-bold uppercase tracking-wide m-0">{group.group}</h4>
            </header>
            <nav aria-label={`Select ${group.group} transaction type`} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isSelected = selected?.id === item.id;
                return (
                  <button key={item.id} type="button" aria-pressed={isSelected} onClick={() => onSelect({ ...item, group: group.group, color: group.color })}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center ${isSelected ? colors.selected : `border-border bg-white hover:bg-background ${colors.item}`}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? colors.icon : "bg-muted text-muted-foreground"}`} aria-hidden="true">
                      <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
                    </div>
                    <span className={`text-[11px] font-semibold leading-tight ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </article>
        );
      })}
    </div>
  );
}

// ── Step 2: Transaction Form ────────────────────────────────────────────────
function StepTransactionForm({ type, form, setForm, accounts }: { type: QuickActionType, form: WizardFormState, setForm: React.Dispatch<React.SetStateAction<WizardFormState>>, accounts: Account[] }) {
  const isMoneyIn = type.group === "Money In";
  const isTransfer = type.group === "Transfers";
  const cashAccounts = accounts.filter((a) => ["a1000","a1010","a1020"].includes(a.id));

  return (
    <fieldset className="space-y-4 border-0 p-0 m-0">
      <legend className="sr-only">Transaction Details</legend>
      <header className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${GROUP_COLORS[type.color || "blue"].icon}`} aria-hidden="true">
          {React.createElement(type.icon, { className: "w-5 h-5" })}
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground m-0">{type.label}</h3>
          <p className="text-xs text-muted-foreground m-0">{type.group}</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {/* Date */}
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="wizard-date" className={FORM_LABEL}>Date</label>
          <DatePicker
            id="wizard-date"
            value={form.date}
            onChange={(val) => setForm({ ...form, date: val })}
          />
        </div>

        {/* Amount */}
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="wizard-amt" className={FORM_LABEL}>Amount *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground" aria-hidden="true">₨</span>
            <input id="wizard-amt" type="number" min="0" step="0.01" value={form.amount} placeholder="0.00"
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className={FORM_INPUT + " pl-8 text-lg font-bold"} aria-invalid={!form.amount} />
          </div>
          {!form.amount && <p className="text-[11px] text-warning mt-1" role="alert">Please enter an amount</p>}
        </div>

        {/* Source / Destination account */}
        {isMoneyIn ? (
          <div className="col-span-2">
            <label htmlFor="wizard-acc-in" className={FORM_LABEL}>Received Into *</label>
            <select id="wizard-acc-in" value={form.debitAcc} onChange={(e) => setForm({ ...form, debitAcc: e.target.value })} className={FORM_INPUT}>
              {cashAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        ) : isTransfer ? (
          <>
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="wizard-acc-to" className={FORM_LABEL}>Transfer To *</label>
              <select id="wizard-acc-to" value={form.debitAcc} onChange={(e) => setForm({ ...form, debitAcc: e.target.value })} className={FORM_INPUT}>
                {cashAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="wizard-acc-from" className={FORM_LABEL}>Transfer From *</label>
              <select id="wizard-acc-from" value={form.creditAcc} onChange={(e) => setForm({ ...form, creditAcc: e.target.value })} className={FORM_INPUT}>
                {cashAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </>
        ) : (
          <div className="col-span-2">
            <label htmlFor="wizard-acc-out" className={FORM_LABEL}>Paid From *</label>
            <select id="wizard-acc-out" value={form.creditAcc} onChange={(e) => setForm({ ...form, creditAcc: e.target.value })} className={FORM_INPUT}>
              {cashAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}

        {/* Description */}
        <div className="col-span-2">
          <label htmlFor="wizard-desc" className={FORM_LABEL}>Description</label>
          <input id="wizard-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={type.description} className={FORM_INPUT} />
        </div>

        {/* Reference */}
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="wizard-ref" className={FORM_LABEL}>Reference No. <span className="normal-case font-normal text-muted-foreground">(optional)</span></label>
          <input id="wizard-ref" value={form.ref} onChange={(e) => setForm({ ...form, ref: e.target.value })}
            placeholder="e.g. RCP-001" className={FORM_INPUT} />
        </div>

        {/* Receipt upload */}
        <div className="col-span-2 sm:col-span-1">
          <label className={FORM_LABEL}>Receipt <span className="normal-case font-normal text-muted-foreground">(optional)</span></label>
          <label className={`${FORM_INPUT} flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground`}>
            <Upload className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="text-xs">{form.receipt ? form.receipt : "Upload receipt…"}</span>
            <input type="file" accept="image/*,application/pdf" className="hidden"
              onChange={(e) => setForm({ ...form, receipt: e.target.files?.[0]?.name || "" })} />
          </label>
        </div>
      </div>
    </fieldset>
  );
}

// ── Step 3: Review ──────────────────────────────────────────────────────────
function StepReview({ type, form, accounts, showAdvanced, setShowAdvanced }: { type: QuickActionType, form: WizardFormState, accounts: Account[], showAdvanced: boolean, setShowAdvanced: React.Dispatch<React.SetStateAction<boolean>> }) {
  const amt = parseFloat(form.amount) || 0;
  const debitAcc  = accounts.find((a) => a.id === form.debitAcc);
  const creditAcc = accounts.find((a) => a.id === form.creditAcc);

  const rows = [
    { label: "Transaction Type", value: type.label },
    { label: "Date",             value: form.date },
    { label: "Amount",           value: `₨ ${amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
    type.group === "Money In"
      ? { label: "Received Into", value: debitAcc?.name || "—" }
      : type.group === "Transfers"
      ? { label: "Transfer",      value: `${creditAcc?.name || "—"} → ${debitAcc?.name || "—"}` }
      : { label: "Paid From",     value: creditAcc?.name || "—" },
    { label: "Description",      value: form.description || "—" },
    form.ref ? { label: "Reference", value: form.ref } : null,
  ].filter(Boolean) as { label: string, value: string }[];

  return (
    <section aria-label="Review Transaction details" className="space-y-4">
      <header className="text-center space-y-1 pb-1">
        <h3 className="text-lg font-bold text-foreground m-0">Review Transaction</h3>
        <p className="text-sm text-muted-foreground m-0">Confirm details before posting</p>
      </header>

      <div className="rounded-2xl border border-border overflow-hidden">
        {rows.map((row, i) => (
          <div key={i} className={`flex items-start gap-4 px-4 py-3 ${i % 2 === 0 ? "bg-muted/20" : "bg-background"}`}>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-32 flex-shrink-0 pt-0.5">{row.label}</span>
            <span className="text-sm font-semibold text-foreground">{row.value}</span>
          </div>
        ))}
        <div className="px-4 py-3 bg-success/10 border-t border-success/20 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold text-success">Will be posted automatically to your records</span>
        </div>
      </div>

      {/* Advanced accounting accordion */}
      <div className="rounded-xl border border-border overflow-hidden">
        <button type="button" onClick={() => setShowAdvanced((p) => !p)}
          aria-expanded={showAdvanced}
          className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Show Accounting Details (Advanced)</span>
          {showAdvanced ? <ChevronUp className="w-4 h-4 text-muted-foreground" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" />}
        </button>
        {showAdvanced && (
          <div className="p-4 space-y-2">
            <div className="rounded-lg overflow-hidden border border-border text-xs">
              <div className="grid grid-cols-3 gap-0 bg-muted/60 border-b border-border">
                <div className="px-3 py-2 font-bold text-muted-foreground uppercase">Account</div>
                <div className="px-3 py-2 font-bold text-muted-foreground uppercase text-right">Debit</div>
                <div className="px-3 py-2 font-bold text-muted-foreground uppercase text-right">Credit</div>
              </div>
              <div className="grid grid-cols-3 bg-info/10/50 border-b border-border">
                <div className="px-3 py-2 font-semibold text-foreground">{debitAcc?.name || "—"}</div>
                <div className="px-3 py-2 text-right font-mono text-info font-bold">{amt.toLocaleString(undefined,{minimumFractionDigits:2})}</div>
                <div className="px-3 py-2 text-right text-muted-foreground">—</div>
              </div>
              <div className="grid grid-cols-3 bg-success/10/50">
                <div className="px-3 py-2 font-semibold text-foreground">{creditAcc?.name || "—"}</div>
                <div className="px-3 py-2 text-right text-muted-foreground">—</div>
                <div className="px-3 py-2 text-right font-mono text-success font-bold">{amt.toLocaleString(undefined,{minimumFractionDigits:2})}</div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground m-0">These journal lines are auto-generated. No manual entry needed.</p>
          </div>
        )}
      </div>
    </section>
  );
}

interface SimpleTransactionWizardProps {
  open: boolean;
  accounts: Account[];
  entries: JournalEntry[];
  fiscalYears: FiscalYear[];
  onSave: (entry: JournalEntry) => void;
  onClose: () => void;
  prefillType?: QuickActionType | null;
}

// ── Main Wizard ─────────────────────────────────────────────────────────────
/**
 * SimpleTransactionWizard component.
 *
 * Renders a step-by-step modal wizard that assists users (such as administrators or accountants)
 * in recording standard business transactions using predefined templates (e.g., student fee collections,
 * utility payments, salary payments, donations) without needing deep double-entry bookkeeping knowledge.
 *
 * @param props - The properties for the component.
 * @returns React element representing the transaction wizard modal.
 */
export default function SimpleTransactionWizard({ open, accounts, entries, fiscalYears, onSave, onClose, prefillType }: SimpleTransactionWizardProps) {
  const [step, setStep] = useState(prefillType ? 2 : 1);
  const [selectedType, setSelectedType] = useState<QuickActionType | null>(prefillType || null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const activeFY = (fiscalYears || []).find((f) => f.status === "active")?.label || "";

  const [form, setForm] = useState<WizardFormState>({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    debitAcc: prefillType?.debitAcc || "a1000",
    creditAcc: prefillType?.creditAcc || "a1010",
    description: prefillType?.description || "",
    ref: "",
    receipt: "",
    fiscal_year: activeFY,
  });

  const handleTypeSelect = (type: QuickActionType) => {
    setSelectedType(type);
    setForm((f) => ({
      ...f,
      debitAcc: type.debitAcc,
      creditAcc: type.creditAcc,
      description: type.description,
    }));
    setStep(2);
  };

  const canProceed = () => {
    if (step === 2) return !!form.amount && parseFloat(form.amount) > 0;
    return true;
  };

  const validate = () => {
    if (!form.amount || parseFloat(form.amount) <= 0) return "Please enter an amount.";
    if (!form.debitAcc || !form.creditAcc) return "Please select a payment source.";
    if (!form.date) return "Please select a date.";
    return null;
  };

  const handleSave = (status: "draft" | "posted") => {
    const err = validate();
    if (err) { alert(err); return; }
    const amt = parseFloat(form.amount);
    const ref = generateJERef(entries);
    const desc = form.description || selectedType!.label;
    onSave({
      id: `je${Date.now()}`,
      ref: form.ref ? `${form.ref}` : ref,
      date: form.date,
      description: desc,
      status,
      created_by: "Admin",
      tags: [selectedType!.tag],
      attachments: [],
      fiscal_year: form.fiscal_year,
      simple_mode: true,
      transaction_type: selectedType!.id,
      lines: [
        { id: `l${Date.now()}a`, account_id: form.debitAcc,  debit: amt, credit: 0,   description: desc },
        { id: `l${Date.now()}b`, account_id: form.creditAcc, debit: 0,   credit: amt, description: desc },
      ],
    });
  };

  const steps = [
    { n: 1, label: "Select Type" },
    { n: 2, label: "Enter Details" },
    { n: 3, label: "Review" },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Transaction"
      subtitle="Money In / Money Out"
      size="md"
      panelClassName="max-h-[92vh]"
      headerExtra={
        <nav aria-label="Wizard Steps" className="flex items-center gap-2">
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              <div className="flex items-center gap-1.5">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                  step > s.n ? "bg-success text-white" : step === s.n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`} aria-current={step === s.n ? "step" : undefined}>
                  {step > s.n ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : s.n}
                </div>
                <span className={`hidden text-[11px] font-semibold sm:block ${step === s.n ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`h-0.5 flex-1 rounded-full transition-all ${step > s.n ? "bg-success" : "bg-border"}`} aria-hidden="true" />}
            </React.Fragment>
          ))}
        </nav>
      }
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <button type="button" onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {step === 1 ? "Cancel" : "Back"}
          </button>
          <div className="flex items-center gap-2">
            {step < 3 && (
              <button type="button" onClick={() => setStep(step + 1)} disabled={!canProceed() || !selectedType}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
                Next <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            {step === 3 && (
              <>
                <button type="button" onClick={() => handleSave("draft")}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted">
                  Save Draft
                </button>
                <button type="button" onClick={() => handleSave("posted")}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Post Transaction
                </button>
              </>
            )}
          </div>
        </div>
      }
    >
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }}>
          {step === 1 && <StepTypeSelection selected={selectedType} onSelect={handleTypeSelect} />}
          {step === 2 && selectedType && <StepTransactionForm type={selectedType} form={form} setForm={setForm} accounts={accounts} />}
          {step === 3 && selectedType && <StepReview type={selectedType} form={form} accounts={accounts} showAdvanced={showAdvanced} setShowAdvanced={setShowAdvanced} />}
        </motion.div>
      </AnimatePresence>
    </Modal>
  );
}
