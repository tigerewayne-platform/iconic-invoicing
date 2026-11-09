/** Starting catalogue. Prices are VAT-exclusive cents and are placeholders until set in the app. */
export const DEFAULT_CATALOG = [
  {
    name: "The Intimate",
    category: "Packages",
    unit: "event",
    unitPrice: 0,
    description:
      "Up to 60 guests. Single high-tensile stretch canopy, timber or aluminium poles, perimeter ratchet and safety anchors, site assessment and wind calibration, installation and strike by our crew.",
  },
  {
    name: "The Estate",
    category: "Packages",
    unit: "event",
    unitPrice: 0,
    description:
      "Up to 150 guests. Large-format multi-pole tensile structure, contouring around trees or terraces, high-wind Cape calibration, ground anchoring or ballast, dedicated rigging team leader on site.",
  },
  {
    name: "The Grand",
    category: "Packages",
    unit: "event",
    unitPrice: 0,
    description:
      "300+ guests. Modular interconnected canopies, reinforced truss and heavy perimeter anchors, engineer sign-off, integrated sidewall weather seals, standby rigging supervisor throughout.",
  },
  { name: "Stretch tent hire (custom)", category: "Tents", unit: "m²", unitPrice: 0, description: "Bedouin stretch canopy, priced per square metre." },
  { name: "Sidewalls", category: "Extras", unit: "m", unitPrice: 0, description: "Clear or white sidewall panels for wind and rain." },
  { name: "Fairy light canopy", category: "Extras", unit: "each", unitPrice: 0, description: "Warm white festoon or fairy light draping." },
  { name: "Flooring / staging", category: "Extras", unit: "m²", unitPrice: 0, description: "Raised timber or interlocking flooring." },
  { name: "Gas heaters", category: "Extras", unit: "each", unitPrice: 0, description: "Patio heaters including gas." },
  { name: "Site visit and assessment", category: "Services", unit: "each", unitPrice: 0, description: "On-site measurement, ground and wind assessment." },
  { name: "Transport", category: "Services", unit: "km", unitPrice: 0, description: "Delivery and collection, return distance." },
  { name: "Crew lodging (outlying areas)", category: "Services", unit: "night", unitPrice: 0, description: "Crew accommodation for Overberg, West Coast and Garden Route events." },
];

export const DEFAULT_QUOTE_TERMS = `This quotation is valid for the period shown above and subject to availability on the event date.
A deposit confirms your date and tent reservation following the site assessment. The balance is payable before installation.
Final layout may be adjusted on site for wind, ground conditions and safety. Postponements due to severe weather warnings are rescheduled with priority.`;

export const DEFAULT_INVOICE_TERMS = `Please use the invoice number as your payment reference.
Installation only proceeds once the balance has cleared. Ownership of all equipment remains with Iconic Stretch Tents.
The client is responsible for damage to equipment beyond normal wear during the hire period.`;
