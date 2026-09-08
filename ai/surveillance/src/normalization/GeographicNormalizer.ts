/**
 * Developer 2: Geographic Normalization & Regional Hierarchy
 *
 * Implements standard hierarchical coding: Country (IN) -> State -> District -> Facility
 * Resolves vernacular aliases, spelling variations, and generates deterministic Region IDs.
 */

export interface NormalizedGeographicEntity {
  regionId: string;       // e.g. "IN-UP-VARANASI"
  state: string;          // e.g. "Uttar Pradesh"
  stateCode: string;      // e.g. "UP"
  district: string;       // e.g. "Varanasi"
  country: string;        // "India"
  countryCode: string;    // "IN"
}

export const INDIAN_STATE_CODES: Record<string, string> = {
  'andhra pradesh': 'AP',
  'arunachal pradesh': 'AR',
  'assam': 'AS',
  'bihar': 'BR',
  'chhattisgarh': 'CG',
  'delhi': 'DL',
  'national capital territory of delhi': 'DL',
  'nct of delhi': 'DL',
  'goa': 'GA',
  'gujarat': 'GJ',
  'haryana': 'HR',
  'himachal pradesh': 'HP',
  'jharkhand': 'JH',
  'karnataka': 'KA',
  'kerala': 'KL',
  'madhya pradesh': 'MP',
  'maharashtra': 'MH',
  'manipur': 'MN',
  'meghalaya': 'ML',
  'mizoram': 'MZ',
  'nagaland': 'NL',
  'odisha': 'OD',
  'orissa': 'OD',
  'punjab': 'PB',
  'rajasthan': 'RJ',
  'sikkim': 'SK',
  'tamil nadu': 'TN',
  'telangana': 'TS',
  'tripura': 'TR',
  'uttar pradesh': 'UP',
  'uttarakhand': 'UK',
  'uttaranchal': 'UK',
  'west bengal': 'WB',
  'jammu and kashmir': 'JK',
  'ladakh': 'LA',
};

export const DISTRICT_ALIAS_MAP: Record<string, { canonicalDistrict: string; state: string }> = {
  'varanasi': { canonicalDistrict: 'Varanasi', state: 'Uttar Pradesh' },
  'banaras': { canonicalDistrict: 'Varanasi', state: 'Uttar Pradesh' },
  'kashi': { canonicalDistrict: 'Varanasi', state: 'Uttar Pradesh' },
  'lucknow': { canonicalDistrict: 'Lucknow', state: 'Uttar Pradesh' },
  'kanpur': { canonicalDistrict: 'Kanpur Nagar', state: 'Uttar Pradesh' },
  'kanpur nagar': { canonicalDistrict: 'Kanpur Nagar', state: 'Uttar Pradesh' },
  'pune': { canonicalDistrict: 'Pune', state: 'Maharashtra' },
  'poona': { canonicalDistrict: 'Pune', state: 'Maharashtra' },
  'mumbai': { canonicalDistrict: 'Mumbai', state: 'Maharashtra' },
  'bombay': { canonicalDistrict: 'Mumbai', state: 'Maharashtra' },
  'kolhapur': { canonicalDistrict: 'Kolhapur', state: 'Maharashtra' },
  'south delhi': { canonicalDistrict: 'South Delhi', state: 'Delhi' },
  'new delhi': { canonicalDistrict: 'New Delhi', state: 'Delhi' },
  'central delhi': { canonicalDistrict: 'Central Delhi', state: 'Delhi' },
  'bengaluru': { canonicalDistrict: 'Bengaluru Urban', state: 'Karnataka' },
  'bangalore': { canonicalDistrict: 'Bengaluru Urban', state: 'Karnataka' },
  'bengaluru urban': { canonicalDistrict: 'Bengaluru Urban', state: 'Karnataka' },
  'ernakulam': { canonicalDistrict: 'Ernakulam', state: 'Kerala' },
  'cochin': { canonicalDistrict: 'Ernakulam', state: 'Kerala' },
  'kochi': { canonicalDistrict: 'Ernakulam', state: 'Kerala' },
  'thiruvananthapuram': { canonicalDistrict: 'Thiruvananthapuram', state: 'Kerala' },
  'trivandrum': { canonicalDistrict: 'Thiruvananthapuram', state: 'Kerala' },
  'chennai': { canonicalDistrict: 'Chennai', state: 'Tamil Nadu' },
  'madras': { canonicalDistrict: 'Chennai', state: 'Tamil Nadu' },
  'hyderabad': { canonicalDistrict: 'Hyderabad', state: 'Telangana' },
  'kolkata': { canonicalDistrict: 'Kolkata', state: 'West Bengal' },
  'calcutta': { canonicalDistrict: 'Kolkata', state: 'West Bengal' },
  'ahmedabad': { canonicalDistrict: 'Ahmedabad', state: 'Gujarat' },
  'jaipur': { canonicalDistrict: 'Jaipur', state: 'Rajasthan' },
  'patna': { canonicalDistrict: 'Patna', state: 'Bihar' },
};

export class GeographicNormalizer {
  /**
   * Normalizes raw state and district strings into a canonical Indian geographic entity.
   */
  static normalizeRegion(
    rawDistrict: string,
    rawState?: string,
  ): NormalizedGeographicEntity | null {
    const cleanDist = (rawDistrict || '').trim().toLowerCase();

    const cleanState = (rawState || '').trim().toLowerCase();

    // 1. Check direct alias lookup or valid Indian state
    let canonicalDist = '';
    let canonicalState = '';

    if (DISTRICT_ALIAS_MAP[cleanDist]) {
      const entry = DISTRICT_ALIAS_MAP[cleanDist];
      canonicalDist = entry.canonicalDistrict;
      canonicalState = rawState && INDIAN_STATE_CODES[cleanState] ? this.toTitleCase(rawState) : entry.state;
    } else if (rawState && INDIAN_STATE_CODES[cleanState]) {
      canonicalDist = this.toTitleCase(rawDistrict);
      canonicalState = this.toTitleCase(rawState);
    } else if (INDIAN_STATE_CODES[cleanDist]) {
      canonicalDist = this.toTitleCase(rawDistrict);
      canonicalState = this.toTitleCase(rawDistrict);
    } else {
      return null;
    }


    // 2. Resolve 2-letter State Code
    const stateKey = canonicalState.toLowerCase();
    const stateCode = INDIAN_STATE_CODES[stateKey] || 'IN';

    // 3. Format deterministic ISO-style Region ID: IN-[STATE]-[DISTRICT]
    const sanitizedDistToken = canonicalDist
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const regionId = `IN-${stateCode}-${sanitizedDistToken || 'DISTRICT'}`;

    return {
      regionId,
      state: canonicalState,
      stateCode,
      district: canonicalDist,
      country: 'India',
      countryCode: 'IN',
    };
  }

  static getStateCode(stateName: string): string | undefined {
    return INDIAN_STATE_CODES[(stateName || '').trim().toLowerCase()];
  }

  static normalize(rawDistrict: string, rawState?: string): NormalizedGeographicEntity | null {
    return GeographicNormalizer.normalizeRegion(rawDistrict, rawState);
  }


  private static toTitleCase(str: string): string {

    return (str || '')
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }
}
