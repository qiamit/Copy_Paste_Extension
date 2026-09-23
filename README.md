# Manak Online Extension

This extension does two things:

1. Enables copy/paste in many form fields where websites try to block it.
2. Fills the same value into all fields matching a given field name.

## Features

- Toggle to enable/disable copy-paste bypass.
- Bulk fill by field identifier:
  - `name`
  - `id`
  - `placeholder`
  - associated label text
- Sends `input` and `change` events after updates for framework-based forms.
- No remote requests; all processing happens locally in the browser.

## Install (Unpacked)

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder: `Ext_Copy_Paste`.
5. Pin and open the extension popup.

## Usage

1. Keep **Enable copy/paste bypass** turned on.
2. Open your target website tab.
3. In the popup, enter:
   - **Field name** (e.g. `email`)
   - **Value** to apply
4. Click **Fill Matching Fields**.
5. The popup shows how many fields were updated.

## Notes and Limitations

- Some pages can still resist changes if fields are inside protected iframes.
- Shadow DOM-heavy apps may require deeper site-specific handling.
- If a site aggressively re-renders inputs, run fill again after the form is fully loaded.

## Troubleshooting

- If fill count is `0`, try:
  - different field name text (id/name/placeholder/label)
  - waiting for the form to finish loading, then rerun
- If popup errors on a page, refresh that page once and retry.
