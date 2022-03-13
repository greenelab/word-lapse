import { useSelect } from "downshift";
import Button from "./Button";

// button with dropdown select
// https://github.com/downshift-js/downshift/tree/master/src/hooks/useSelect
const Select = ({ options, value, onChange, ...props }) => {
  const {
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    highlightedIndex,
    getItemProps,
  } = useSelect({
    items: options,
    selectedItem: value,
    onSelectedItemChange: ({ selectedItem }) => onChange(selectedItem),
  });

  return (
    <div className="dropdown-container">
      <Button {...getToggleButtonProps()} {...props} icon="book" />
      <div {...getMenuProps()} className="dropdown">
        {isOpen && (
          <div className="dropdown-list">
            {options.map((item, index) => (
              <div
                key={index}
                {...getItemProps({ item, index })}
                className="dropdown-option"
                data-highlighted={highlightedIndex === index}
              >
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Select;
