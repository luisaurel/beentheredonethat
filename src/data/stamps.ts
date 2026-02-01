export interface Stamp {
  countryCode: string;
  countryName: string;
  asset: string;
}

export const stamps: Stamp[] = [
  {
    countryCode: "DE",
    countryName: "Deutschland",
    asset: "de.svg"
  },
  {
    countryCode: "FR",
    countryName: "Frankreich",
    asset: "fr.svg"
  },
  {
    countryCode: "IT",
    countryName: "Italien",
    asset: "it.svg"
  }
];
