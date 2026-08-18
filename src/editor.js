import { LitElement, html } from 'lit';

const SCHEMA = [
  {
    name: "entities",
    selector: { entity: { multiple: true, domain: "sensor" } }
  },
  {
    type: "grid",
    name: "",
    schema: [
      { name: "title", selector: { text: {} } },
      { name: "icon", selector: { icon: {} } }
    ]
  },
  {
    type: "grid",
    name: "",
    schema: [
      { name: "display_preset", selector: { select: { options: [{value: "standard", label: "Standard"}, {value: "compact", label: "Compact"}, {value: "e_ink", label: "E-ink"}] } } },
      { name: "view_mode", selector: { select: { options: [{value: "mixed", label: "Mixed"}, {value: "tabs", label: "Tabs"}] } } }
    ]
  },
  {
    type: "grid",
    name: "",
    schema: [
      { name: "max_departures", selector: { number: { min: 1, max: 20, mode: "box" } } },
      { name: "refresh_interval", selector: { number: { min: 10, max: 300, mode: "box", unit_of_measurement: "s" } } }
    ]
  },
  { name: "header_color", selector: { text: { type: "color" } } },
  {
    type: "expandable",
    name: "",
    title: "Filtry globalne",
    schema: [
      { name: "filter_routes", selector: { text: { multiple: true } } },
      { name: "destination_filter", selector: { text: { multiple: true } } },
      { name: "filter_platform", selector: { text: {} } },
      { name: "filter_track", selector: { text: {} } },
      { name: "highlight_mode", selector: { boolean: {} } },
      { name: "hide_terminus", selector: { boolean: {} } },
      { name: "realtime_only", selector: { boolean: {} } }
    ]
  },
  {
    type: "expandable",
    name: "",
    title: "Opcje wizualne",
    schema: [
      { name: "show_stop_name", selector: { boolean: {} } },
      { name: "group_by_provider", selector: { boolean: {} } },
      { name: "show_delays", selector: { boolean: {} } },
      { name: "show_footer", selector: { boolean: {} } },
      { name: "show_bike", selector: { boolean: {} } },
      { name: "show_wheelchair", selector: { boolean: {} } },
      { name: "show_ac", selector: { boolean: {} } },
      { name: "show_ticket_machine", selector: { boolean: {} } }
    ]
  }
];

export class MzkzgTransportCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _config: { type: Object }
    };
  }

  setConfig(config) {
    this._config = { ...config };
  }

  _valueChanged(ev) {
    if (!this._config || !this.hass) return;
    const value = ev.detail.value;
    
    // Normalize string lists
    if (typeof value.filter_routes === 'string') {
        value.filter_routes = value.filter_routes.split(',').map(s => s.trim()).filter(s => s);
    }
    if (typeof value.destination_filter === 'string') {
        value.destination_filter = value.destination_filter.split(',').map(s => s.trim()).filter(s => s);
    }

    this._config = { ...this._config, ...value };
    const event = new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  render() {
    if (!this.hass || !this._config) {
      return html``;
    }

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${SCHEMA}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  _computeLabel(schema) {
    const labels = {
      entities: "Encje (Sensory)",
      title: "Tytuł",
      icon: "Ikona",
      display_preset: "Motyw",
      view_mode: "Widok",
      max_departures: "Maksymalna liczba odjazdów",
      refresh_interval: "Odświeżanie",
      header_color: "Kolor nagłówka",
      filter_routes: "Filtruj linie",
      destination_filter: "Filtruj kierunki",
      filter_platform: "Filtruj peron",
      filter_track: "Filtruj tor",
      highlight_mode: "Podświetlaj zamiast ukrywać",
      hide_terminus: "Ukryj kończące trasę",
      realtime_only: "Tylko realtime",
      group_by_provider: "Grupuj po przewoźniku",
      show_delays: "Pokaż opóźnienia",
      show_footer: "Pokaż stopkę",
      show_bike: "Ikona roweru",
      show_wheelchair: "Ikona wózka",
      show_ac: "Ikona klimatyzacji",
      show_ticket_machine: "Ikona biletomatu"
    };
    return labels[schema.name] || schema.name;
  }
}

customElements.define("mzkzg-transport-card-editor", MzkzgTransportCardEditor);
customElements.define("polish-transport-card-editor", class extends MzkzgTransportCardEditor {});
