# JavaScript file responsibilities

## Public event website

- `app/app.js` — public page startup and data refresh.
- `app/components.js` — public page header, dialogs and map-page HTML.
- `app/map.js` — public SVG map rendering, zoom, pan and booth keyboard input.
- `app/ui.js` — public search, filters, booth details, directions and sharing.
- `app/i18n.js` — Lao/English text for the public website.
- `app/map-routing.js` — route calculation along public-map walkways.

## Map Manager

- `admin/manager.js` — Map Builder canvas, editing, selection, drag/resize, pan, zoom, layers, preview and export.
- `admin/manager-layout-source.js` — Manager buttons that load the published Google Sheet layout or a default layout.
- `admin/manager-i18n.js` — Lao/English text for Manager-only controls.
- `admin/admin-manager.js` — authenticated save bridge from Manager to the PHP save endpoint.

## Shared modules

- `shared/api.js` — Google Sheets data loading used by the public site and Manager.
- `shared/config.js` — common constants and browser helpers.
- `shared/dom-utils.js` — safe shared DOM helpers.
- `shared/map-layout.js` — the shared map-layout schema, defaults and active layout.
- `shared/state.js` — public-site runtime state.
