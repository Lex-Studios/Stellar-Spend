import React from 'react';

export interface InsuranceOption {
  id: string;
  label: string;
  description?: string;
  price: number;
  currency?: string;
  selected?: boolean;
  disabled?: boolean;
}

export interface OptionSelectorProps {
  options: InsuranceOption[];
  selectedId?: string;
  onSelect: (id: string) => void;
  name?: string;
  className?: string;
}

export interface OptionSummaryProps {
  options: InsuranceOption[];
  selectedId?: string;
  currency?: string;
  className?: string;
}

export function formatPrice(price: number, currency = 'USD'): string {
  const safePrice = Number.isFinite(price) ? price : 0;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(safePrice);
  } catch {
    return `${currency} ${safePrice.toFixed(2)}`;
  }
}

export function getSelectedOption(
  options: InsuranceOption[],
  selectedId?: string,
): InsuranceOption | undefined {
  if (!options || options.length === 0) {
    return undefined;
  }
  if (selectedId) {
    const match = options.find((option) => option.id === selectedId);
    if (match) {
      return match;
    }
  }
  return options.find((option) => option.selected) ?? options[0];
}

export function calculateSummaryTotal(
  options: InsuranceOption[],
  selectedId?: string,
): number {
  const selected = getSelectedOption(options, selectedId);
  return selected ? selected.price : 0;
}

export const OptionSelector: React.FC<OptionSelectorProps> = ({
  options,
  selectedId,
  onSelect,
  name = 'insurance-option',
  className,
}) => {
  const active = getSelectedOption(options, selectedId);

  return (
    <fieldset className={className}>
      <legend className="sr-only">Insurance options</legend>
      <ul className="insurance-option__list">
        {options.map((option) => {
          const isSelected = active?.id === option.id;
          return (
            <li key={option.id} className="insurance-option__item">
              <label
                className={`insurance-option__label${isSelected ? ' insurance-option__label--selected' : ''}`}
              >
                <input
                  type="radio"
                  name={name}
                  value={option.id}
                  checked={isSelected}
                  disabled={option.disabled}
                  onChange={() => onSelect(option.id)}
                />
                <span className="insurance-option__label-text">{option.label}</span>
                {option.description ? (
                  <span className="insurance-option__description">{option.description}</span>
                ) : null}
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
};

export const OptionSummary: React.FC<OptionSummaryProps> = ({
  options,
  selectedId,
  currency,
  className,
}) => {
  const selected = getSelectedOption(options, selectedId);
  const total = calculateSummaryTotal(options, selectedId);
  const displayCurrency = currency ?? selected?.currency ?? 'USD';

  return (
    <div className={className}>
      <div className="insurance-option__summary-row">
        <span className="insurance-option__summary-label">
          {selected ? selected.label : 'No option selected'}
        </span>
        <span className="insurance-option__summary-price">
          {formatPrice(total, displayCurrency)}
        </span>
      </div>
    </div>
  );
};

export interface InsuranceOptionProps {
  options: InsuranceOption[];
  selectedId?: string;
  onSelect: (id: string) => void;
  currency?: string;
  className?: string;
}

const InsuranceOption: React.FC<InsuranceOptionProps> = ({
  options,
  selectedId,
  onSelect,
  currency,
  className,
}) => {
  return (
    <div className={className}>
      <OptionSelector
        options={options}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      <OptionSummary
        options={options}
        selectedId={selectedId}
        currency={currency}
      />
    </div>
  );
};

export default InsuranceOption;
