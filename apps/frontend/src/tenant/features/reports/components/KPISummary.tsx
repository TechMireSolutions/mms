import { KPISummarySettings } from './kpiSummarySettings';
import { KPICardsGrid } from './kpiSummaryCards';
import type { KPISummaryProps } from './kpiSummaryTypes';
import { useKPISummaryModel } from './useKPISummaryModel';

export default function KPISummary({ category, role }: KPISummaryProps): JSX.Element {
  const model = useKPISummaryModel({ category, role });

  return (
    <div className="w-full space-y-3">
      <KPISummarySettings
        category={category}
        moduleLabel={model.moduleLabel}
        isOpen={model.isConfigOpen}
        cards={model.possibleCards}
        customCards={model.customCards}
        selectedCardIds={model.selectedCardIds}
        primaryVolume={model.primaryVolume}
        defaultCollection={model.defaultCollection}
        editingCardConfig={model.editingCardConfig}
        onOpenChange={model.setIsConfigOpen}
        onCancelEdit={model.cancelEdit}
        onToggleCard={model.handleToggleCard}
        onEditCard={model.handleEditCard}
        onDeleteCard={model.handleDeleteCustomCard}
      />
      <KPICardsGrid cards={model.visibleCards} onAddCustom={model.openCustomCardBuilder} />
    </div>
  );
}
