import {getButtonImage} from 'editor_tiny/utils';
import {get_string as getString} from 'core/str';
import {
    component,
    fontColorButtonName,
    icon,
} from './common';

let colorPickerContainer = null;
let isPickerVisible = false;
let clickHandler = null;

/**
 * Displays the color picker
 */
const showColorPicker = (editor, buttonTitle) => {

    hideColorPicker();

    // Creates the main container
    colorPickerContainer = document.createElement('div');
    colorPickerContainer.className = 'tiny-fontcolor-picker';
    Object.assign(colorPickerContainer.style, {
        position: 'fixed',
        zIndex: '999999',
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border: '1px solid #ddd',
        width: '200px'
    });

    // Create input colour
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    Object.assign(colorInput.style, {
        width: '100%',
        height: '50px',
        cursor: 'pointer',
        border: '2px solid #eee',
        borderRadius: '6px',
        padding: '2px',
        display: 'block'
    });

    // set colour based on the initial/previous selection
    const initialColor = getSelectionColor(editor);
    if (initialColor) {
        colorInput.value = rgbToHex(initialColor);
    }

    // Apply colour when changed
    colorInput.addEventListener('input', (e) => {
        editor.execCommand('ForeColor', false, e.target.value);
    });

    // Close colour picker when it finishes selecting delay de closing.
    colorInput.addEventListener('change', () => setTimeout(hideColorPicker, 2000));

    // Add colour picker to the container
    colorPickerContainer.appendChild(colorInput);

    // Add the container to the DOM
    document.body.appendChild(colorPickerContainer);
    isPickerVisible = true;

    // Position the selector near the toolbar button
    const button = editor.editorContainer.querySelector(`.tox-tbtn[aria-label="${buttonTitle}"]`);
    if (button) {
        const rect = button.getBoundingClientRect();
        Object.assign(colorPickerContainer.style, {
            top: `${rect.bottom}px`,
            left: `${rect.left}px`
        });
    }

    // Focus the input after a delay
    setTimeout(() => colorInput.focus(), 1500);

    // Close
    clickHandler = (e) => {
        if (colorPickerContainer && !colorPickerContainer.contains(e.target)) {
            hideColorPicker();
        }
    };
    document.addEventListener('mousedown', clickHandler);
};




/**
 * Get the colour of the selected text
 */
function getSelectionColor(editor) {
    if (!editor || !editor.dom || !editor.selection) return null;

    const dom = editor.dom;
    const selection = editor.selection;
    const nodes = selection.getSelectedBlocks() || [selection.getNode()];

    for (const node of nodes) {
        if (!node) continue;

        const color = dom.getStyle(node, 'color') || node.getAttribute('color');
        if (color) return color;

        const coloredChildren = dom.select('*[style*="color"], *[color]', node);
        if (coloredChildren?.length > 0) {
            const childColor = dom.getStyle(coloredChildren[0], 'color') ||
                             coloredChildren[0]?.getAttribute('color');
            if (childColor) return childColor;
        }
    }
    return null;
}

/**
 * Hide colour picker
 */
const hideColorPicker = () => {
    if (colorPickerContainer && isPickerVisible) {
        if (colorPickerContainer.parentNode) {
            colorPickerContainer.parentNode.removeChild(colorPickerContainer);
        }
        colorPickerContainer = null;
        isPickerVisible = false;

        if (clickHandler) {
            document.removeEventListener('mousedown', clickHandler);
            clickHandler = null;
        }
    }
};

/**
 * Convierte color RGB a HEX
 */
function rgbToHex(rgb) {
    if (!rgb) return '#000000'; // Default black.

    const rgbValues = rgb.match(/\d+/g);
    if (!rgbValues || rgbValues.length < 3) return '#000000';

    const r = parseInt(rgbValues[0]);
    const g = parseInt(rgbValues[1]);
    const b = parseInt(rgbValues[2]);

    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16).padStart(2, '0');
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

/**
 * Plugin configuration
 */
export const getSetup = async () => {
    const [buttonTitle, menuTitle, btnImage] = await Promise.all([
        getString('button_fontcolor', component),
        getString('menuitem_fontcolor', component),
        getButtonImage('icon', component)
    ]);

    return (editor) => {
        editor.ui.registry.addIcon(icon, btnImage.html);

        editor.ui.registry.addButton(fontColorButtonName, {
            icon,
            tooltip: buttonTitle,
            onAction: () => {
                if (isPickerVisible) {
                    hideColorPicker();
                } else {
                    showColorPicker(editor, buttonTitle);
                }
            }
        });

        editor.on('blur', hideColorPicker);
    };
};