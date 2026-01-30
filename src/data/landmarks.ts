// src/data/landmarks.ts
export interface Landmark {
    id: string;
    name: string;
    lat: number;
    lng: number;
    description: string;
  }
  
  export const landmarks = [
    {
        name: "DHBW",
        country: "Deutschland",
        city: "Mosbach",
        location: {
          lat: 49.35175,
          lng:  9.14853
        }
      },
    {
      name: "Eiffel Tower",
      country: "France",
      city: "Paris",
      location: {
        lat: 48.8584,
        lng: 2.2945
      }
    },
    {
      name: "Colosseum",
      country: "Italy",
      city: "Rome",
      location: {
        lat: 41.8902,
        lng: 12.4922
      }
    },
    {
      name: "Brandenburg Gate",
      country: "Germany",
      city: "Berlin",
      location: {
        lat: 52.5163,
        lng: 13.3777
      }
    },
    {
      name: "Sagrada Familia",
      country: "Spain",
      city: "Barcelona",
      location: {
        lat: 41.4036,
        lng: 2.1744
      }
    },
    {
      name: "Big Ben",
      country: "United Kingdom",
      city: "London",
      location: {
        lat: 51.5007,
        lng: -0.1246
      }
    },
    {
      name: "Statue of Liberty",
      country: "USA",
      city: "New York",
      location: {
        lat: 40.6892,
        lng: -74.0445
      }
    },
    {
      name: "Christ the Redeemer",
      country: "Brazil",
      city: "Rio de Janeiro",
      location: {
        lat: -22.9519,
        lng: -43.2105
      }
    },
    {
      name: "Sydney Opera House",
      country: "Australia",
      city: "Sydney",
      location: {
        lat: -33.8568,
        lng: 151.2153
      }
    }
  ];