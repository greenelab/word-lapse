import { useEffect, useState } from "react";
import { useCombobox } from "downshift";
import { useDebounce } from "use-debounce";
import "./Combobox.css";

// combo box, i.e. input box with dropdown autocomplete
// https://github.com/downshift-js/downshift/tree/master/src/hooks/useCombobox
const Combobox = ({ value, onChange, options, ...props }) => {
  const [input, setInput] = useState(value);
  const [debouncedInput] = useDebounce(input, 100);
  const [autocomplete, setAutocomplete] = useState([]);

  // downshift props
  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
    closeMenu,
  } = useCombobox({
    items: autocomplete,
    inputValue: input,
    onInputValueChange: ({ inputValue }) => setInput(inputValue),
    onSelectedItemChange: ({ selectedItem }) =>
      onChange(selectedItem.concept || selectedItem.vocab),
  });

  // get autocomplete results
  useEffect(() => {
    (async () => setAutocomplete(await options(debouncedInput)))();
  }, [options, debouncedInput]);

  // when value changes upstream, update local input value here
  useEffect(() => {
    setInput(value);
  }, [value]);

  // when user explicitly submits form by pressing enter
  const onSubmit = (event) => {
    // prevent page from navigating away on form submit
    event.preventDefault();
    // if autocomplete result highlighted, let downshift do its thing
    if (isOpen && highlightedIndex !== -1) return;
    // update value immediately
    onChange(input);
    // close autocomplete menu
    closeMenu();
  };

  return (
    <form
      onSubmit={onSubmit}
      {...getComboboxProps()}
      className="dropdown-container"
    >
      <input
        {...getInputProps()}
        onSubmit={onSubmit}
        className="input"
        {...props}
      />
      <div {...getMenuProps()} className="dropdown">
        {isOpen && !!autocomplete.length && (
          <div className="dropdown-list">
            {autocomplete.map((item, index) => (
              <div
                key={index}
                {...getItemProps({ item, index })}
                className="dropdown-option"
                data-highlighted={highlightedIndex === index}
              >
                <span className="dropdown-cell">{item.vocab}</span>
                <span className="dropdown-cell">{item.concept || ""}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </form>
  );
};

export default Combobox;
