export type CountryCode = "DE" | "CH" | "FR" | "BE" | "NL" | "IT";

export interface Country {
  code: CountryCode;
  name: string;      // Anzeige-Name
  uiName?: string;   // optional, z.B. "Holland" statt "Niederlande"
}

export const COUNTRIES: Country[] = [
  { code: "DE", name: "Deutschland" },
  { code: "CH", name: "Schweiz" },
  { code: "FR", name: "Frankreich" },
  { code: "BE", name: "Belgien" },
  { code: "NL", name: "Niederlande", uiName: "Holland" },
  { code: "IT", name: "Italien" }
];
