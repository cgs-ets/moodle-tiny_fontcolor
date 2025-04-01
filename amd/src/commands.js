// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Commands helper for the Moodle tiny_fontcolor plugin.
 *
 * @module      tiny_fontcolor/commands
 * @copyright   2025 Veronica Bermegui
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 *
 */

import {getButtonImage} from 'editor_tiny/utils';
import {get_string as getString} from 'core/str';
import {
    component,
    fontColorButtonName,
    fontColorMenuItemName,
    icon,
} from './common';


let colorPickerContainer = null;
let isPickerVisible = false;
let clickHandler = null;
let originalHide = null;

/**
 * Show colour picker
 */
const showColorPicker = (editor, buttonTitle) => {
    // hide any visible picker first
    hideColorPicker();

    // Create the colour picker container
    colorPickerContainer = document.createElement('div');
    colorPickerContainer.className = 'fontcolor-picker';
    Object.assign(colorPickerContainer.style, {
        position: 'absolute',
        zIndex: '999999',
        backgroundColor: 'white',
        padding: '5px',
        borderRadius: '3px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        border: '1px solid #ddd'
    });

    // Create input colour
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    Object.assign(colorInput.style, {
        width: '30px',
        height: '30px',
        border: 'none',
        cursor: 'pointer',
        padding: 0
    });

    // Apply colour
    colorInput.addEventListener('change', () => {
        editor.execCommand('ForeColor', false, colorInput.value);
        hideColorPicker();
    });

    // Position relative to the button
    const button = editor.editorContainer?.querySelector(`.tox-tbtn[aria-label="${buttonTitle}"]`);
    if (button) {
        const rect = button.getBoundingClientRect();
        Object.assign(colorPickerContainer.style, {
            top: `${rect.bottom + window.scrollY}px`,
            left: `${rect.left + window.scrollX}px`
        });
    }

    // Add to the DOM
    colorPickerContainer.appendChild(colorInput);
    document.body.appendChild(colorPickerContainer);
    isPickerVisible = true;

    // Close on outside click
    setTimeout(() => {
        clickHandler = (e) => {
            if (!colorPickerContainer?.contains(e.target) &&
                !button?.contains(e.target)) {
                hideColorPicker();
            }
        };
        document.addEventListener('click', clickHandler);

        // Clean up event listener when hiding
        originalHide = hideColorPicker;
        hideColorPicker = () => {
            if (clickHandler) {
                document.removeEventListener('click', clickHandler);
                clickHandler = null;
            }
            originalHide();
            hideColorPicker = originalHide;
        };
    }, 0);
};

/**
 * Hides the color picker
 */
let hideColorPicker = () => {
    if (colorPickerContainer && isPickerVisible) {
        document.body.removeChild(colorPickerContainer);
        colorPickerContainer = null;
        isPickerVisible = false;
    }
};

export const getSetup = async () => {
    const [buttonTitle, menuTitle, btnImage] = await Promise.all([
        getString('button_fontcolor', component),
        getString('menuitem_fontcolor', component),
        getButtonImage('icon', component)
    ]);

    return (editor) => {
        editor.ui.registry.addIcon(icon, btnImage.html);

        // Toolbar button
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

        // Menu item (original behavior)
        editor.ui.registry.addMenuItem(fontColorMenuItemName, {
            icon,
            text: menuTitle,
            onAction: () => {
                editor.execCommand('ForeColor', false, '#000000');
            }
        });

        // Close picker when the editor loses focus
        editor.on('blur', hideColorPicker);
    };
};