/**
 * Starting points for "Neu entdecken" per Bundesland. Hard-coded on purpose:
 * asking Overpass for all towns of a whole state is too heavy for the public
 * servers (504 timeouts). Places are then searched around one of these.
 * kind: 'city' = 8 km radius, 'town' = 5 km, 'suburb' (city districts) = 3 km.
 */
import type { Town } from './overpass';

type Entry = [name: string, lat: number, lon: number, kind?: 'city' | 'town' | 'suburb'];

const DATA: Record<string, Entry[]> = {
  'DE-BW': [
    ['Stuttgart', 48.78, 9.18, 'city'], ['Karlsruhe', 49.01, 8.4, 'city'], ['Mannheim', 49.49, 8.47, 'city'], ['Freiburg im Breisgau', 47.99, 7.85, 'city'],
    ['Heidelberg', 49.4, 8.69], ['Ulm', 48.4, 9.99], ['Heilbronn', 49.14, 9.22], ['Pforzheim', 48.89, 8.7], ['Reutlingen', 48.49, 9.21],
    ['Tübingen', 48.52, 9.06], ['Konstanz', 47.66, 9.18], ['Baden-Baden', 48.76, 8.24], ['Esslingen am Neckar', 48.74, 9.31], ['Ludwigsburg', 48.9, 9.19],
  ],
  'DE-BY': [
    ['München', 48.14, 11.58, 'city'], ['Nürnberg', 49.45, 11.08, 'city'], ['Augsburg', 48.37, 10.9, 'city'], ['Regensburg', 49.01, 12.1],
    ['Würzburg', 49.79, 9.95], ['Ingolstadt', 48.76, 11.42], ['Erlangen', 49.6, 11.0], ['Bamberg', 49.89, 10.89], ['Bayreuth', 49.95, 11.58],
    ['Passau', 48.57, 13.43], ['Rosenheim', 47.86, 12.12], ['Landshut', 48.54, 12.15], ['Garmisch-Partenkirchen', 47.49, 11.1], ['Lindau', 47.55, 9.68],
    ['Füssen', 47.57, 10.7],
  ],
  'DE-BE': [
    ['Mitte', 52.52, 13.4, 'suburb'], ['Kreuzberg', 52.5, 13.4, 'suburb'], ['Prenzlauer Berg', 52.54, 13.42, 'suburb'],
    ['Charlottenburg', 52.51, 13.3, 'suburb'], ['Friedrichshain', 52.515, 13.45, 'suburb'], ['Neukölln', 52.48, 13.44, 'suburb'],
    ['Schöneberg', 52.48, 13.35, 'suburb'], ['Spandau', 52.54, 13.2, 'suburb'], ['Köpenick', 52.44, 13.58, 'suburb'],
    ['Steglitz', 52.46, 13.32, 'suburb'], ['Pankow', 52.57, 13.4, 'suburb'], ['Wannsee', 52.42, 13.16, 'suburb'],
  ],
  'DE-BB': [
    ['Potsdam', 52.4, 13.06, 'city'], ['Cottbus', 51.76, 14.33], ['Brandenburg an der Havel', 52.41, 12.53], ['Frankfurt (Oder)', 52.34, 14.55],
    ['Oranienburg', 52.75, 13.24], ['Eberswalde', 52.83, 13.82], ['Neuruppin', 52.92, 12.8], ['Lübbenau/Spreewald', 51.87, 13.96],
    ['Rheinsberg', 53.1, 12.9], ['Bad Saarow', 52.29, 14.06],
  ],
  'DE-HB': [
    ['Bremen-Mitte', 53.075, 8.807, 'suburb'], ['Bremen-Neustadt', 53.065, 8.79, 'suburb'], ['Bremen-Findorff', 53.09, 8.79, 'suburb'],
    ['Bremen-Horn', 53.1, 8.87, 'suburb'], ['Vegesack', 53.17, 8.62, 'suburb'], ['Bremerhaven', 53.54, 8.58],
  ],
  'DE-HH': [
    ['Altstadt', 53.55, 9.99, 'suburb'], ['St. Pauli', 53.55, 9.96, 'suburb'], ['Altona', 53.55, 9.94, 'suburb'], ['Eimsbüttel', 53.575, 9.95, 'suburb'],
    ['Ottensen', 53.553, 9.925, 'suburb'], ['Winterhude', 53.59, 10.0, 'suburb'], ['Eppendorf', 53.59, 9.98, 'suburb'], ['HafenCity', 53.54, 10.0, 'suburb'],
    ['Blankenese', 53.56, 9.8, 'suburb'], ['Bergedorf', 53.49, 10.21, 'suburb'], ['Harburg', 53.46, 9.98, 'suburb'], ['Wandsbek', 53.58, 10.08, 'suburb'],
  ],
  'DE-HE': [
    ['Frankfurt am Main', 50.11, 8.68, 'city'], ['Wiesbaden', 50.08, 8.24, 'city'], ['Kassel', 51.31, 9.48], ['Darmstadt', 49.87, 8.65],
    ['Offenbach am Main', 50.1, 8.77], ['Marburg', 50.81, 8.77], ['Gießen', 50.58, 8.68], ['Fulda', 50.55, 9.68], ['Hanau', 50.13, 8.92],
    ['Bad Homburg', 50.23, 8.62], ['Rüdesheim am Rhein', 49.98, 7.92], ['Limburg an der Lahn', 50.39, 8.06],
  ],
  'DE-MV': [
    ['Rostock', 54.09, 12.13, 'city'], ['Schwerin', 53.63, 11.41], ['Stralsund', 54.31, 13.09], ['Greifswald', 54.09, 13.38], ['Wismar', 53.89, 11.46],
    ['Neubrandenburg', 53.56, 13.26], ['Warnemünde', 54.18, 12.08], ['Binz', 54.4, 13.61], ['Heringsdorf', 53.95, 14.17], ['Waren (Müritz)', 53.52, 12.68],
    ['Kühlungsborn', 54.15, 11.75],
  ],
  'DE-NI': [
    ['Hannover', 52.37, 9.73, 'city'], ['Braunschweig', 52.27, 10.52, 'city'], ['Oldenburg', 53.14, 8.21], ['Osnabrück', 52.28, 8.05],
    ['Wolfsburg', 52.42, 10.79], ['Göttingen', 51.54, 9.93], ['Hildesheim', 52.15, 9.95], ['Lüneburg', 53.25, 10.41], ['Celle', 52.62, 10.08],
    ['Wilhelmshaven', 53.53, 8.11], ['Goslar', 51.91, 10.43], ['Cuxhaven', 53.87, 8.69], ['Norderney', 53.71, 7.15], ['Emden', 53.37, 7.21],
  ],
  'DE-NW': [
    ['Köln', 50.94, 6.96, 'city'], ['Düsseldorf', 51.23, 6.77, 'city'], ['Dortmund', 51.51, 7.47, 'city'], ['Essen', 51.46, 7.01, 'city'],
    ['Duisburg', 51.43, 6.76, 'city'], ['Bochum', 51.48, 7.22, 'city'], ['Wuppertal', 51.26, 7.15, 'city'], ['Bielefeld', 52.02, 8.53, 'city'],
    ['Bonn', 50.73, 7.1, 'city'], ['Münster', 51.96, 7.63, 'city'], ['Mönchengladbach', 51.19, 6.44], ['Aachen', 50.78, 6.08], ['Krefeld', 51.33, 6.56],
    ['Oberhausen', 51.47, 6.85], ['Gelsenkirchen', 51.51, 7.1], ['Neuss', 51.2, 6.69], ['Paderborn', 51.72, 8.75], ['Siegen', 50.87, 8.02],
    ['Solingen', 51.17, 7.08], ['Leverkusen', 51.03, 6.98], ['Recklinghausen', 51.61, 7.2],
  ],
  'DE-RP': [
    ['Mainz', 50.0, 8.27, 'city'], ['Ludwigshafen am Rhein', 49.48, 8.44], ['Koblenz', 50.36, 7.59], ['Trier', 49.75, 6.64], ['Kaiserslautern', 49.44, 7.77],
    ['Worms', 49.63, 8.36], ['Speyer', 49.32, 8.43], ['Neustadt an der Weinstraße', 49.35, 8.14], ['Bingen am Rhein', 49.97, 7.9], ['Cochem', 50.15, 7.17],
    ['Bernkastel-Kues', 49.92, 7.07], ['Landau in der Pfalz', 49.2, 8.12],
  ],
  'DE-SL': [
    ['Saarbrücken', 49.23, 7.0, 'city'], ['Neunkirchen', 49.35, 7.18], ['Homburg', 49.33, 7.34], ['Völklingen', 49.25, 6.86], ['Saarlouis', 49.31, 6.75],
    ['Merzig', 49.44, 6.64], ['St. Wendel', 49.47, 7.17], ['St. Ingbert', 49.28, 7.12], ['Mettlach', 49.49, 6.6],
  ],
  'DE-SN': [
    ['Dresden', 51.05, 13.74, 'city'], ['Leipzig', 51.34, 12.37, 'city'], ['Chemnitz', 50.83, 12.92], ['Zwickau', 50.72, 12.49], ['Görlitz', 51.15, 14.99],
    ['Meißen', 51.16, 13.47], ['Bautzen', 51.18, 14.42], ['Freiberg', 50.91, 13.34], ['Plauen', 50.5, 12.14], ['Pirna', 50.96, 13.94],
    ['Bad Schandau', 50.92, 14.15], ['Radebeul', 51.1, 13.66],
  ],
  'DE-ST': [
    ['Magdeburg', 52.13, 11.63, 'city'], ['Halle (Saale)', 51.48, 11.97, 'city'], ['Dessau-Roßlau', 51.84, 12.24], ['Lutherstadt Wittenberg', 51.87, 12.65],
    ['Quedlinburg', 51.79, 11.15], ['Wernigerode', 51.83, 10.78], ['Naumburg', 51.15, 11.81], ['Halberstadt', 51.9, 11.05], ['Stendal', 52.61, 11.86],
    ['Merseburg', 51.36, 11.99],
  ],
  'DE-SH': [
    ['Kiel', 54.32, 10.14, 'city'], ['Lübeck', 53.87, 10.69, 'city'], ['Flensburg', 54.79, 9.44], ['Neumünster', 54.07, 9.98], ['Schleswig', 54.52, 9.56],
    ['Husum', 54.48, 9.05], ['Travemünde', 53.96, 10.87], ['Sankt Peter-Ording', 54.31, 8.64], ['Westerland', 54.91, 8.31], ['Eckernförde', 54.47, 9.84],
    ['Timmendorfer Strand', 53.99, 10.78], ['Heide', 54.2, 9.1],
  ],
  'DE-TH': [
    ['Erfurt', 50.98, 11.03, 'city'], ['Jena', 50.93, 11.59], ['Weimar', 50.98, 11.33], ['Gera', 50.88, 12.08], ['Gotha', 50.95, 10.7], ['Eisenach', 50.98, 10.32],
    ['Suhl', 50.61, 10.69], ['Nordhausen', 51.5, 10.79], ['Ilmenau', 50.68, 10.92], ['Mühlhausen', 51.21, 10.45], ['Altenburg', 50.99, 12.43], ['Oberhof', 50.71, 10.73],
  ],
};

export function townsOf(regionCode: string): Town[] {
  return (DATA[regionCode] ?? []).map(([name, lat, lon, kind = 'town'], id) => ({ id: -(id + 1), name, lat, lon, kind }));
}

export const TOWN_REGIONS = Object.keys(DATA);
