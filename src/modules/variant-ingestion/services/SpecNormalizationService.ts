export class SpecNormalizationService {
  static normalizeMileage(raw: string | number | undefined): string | undefined {
    if (raw === undefined || raw === null) return undefined;
    const s = String(raw).toLowerCase().trim();
    // Extract numeric part
    const match = s.match(/([\d.]+)/);
    if (!match) return undefined;
    const value = parseFloat(match[1]);
    if (isNaN(value)) return undefined;
    return `${value} kmpl`;
  }

  static normalizePower(raw: string | undefined): string | undefined {
    if (!raw) return undefined;
    const s = raw.toLowerCase().trim();
    // handles "82 bhp @ 6000rpm", "82bhp", "82 kw"
    const bhpMatch = s.match(/([\d.]+)\s*(bhp|ps|hp)/);
    const kwMatch = s.match(/([\d.]+)\s*kw/);
    if (bhpMatch) {
      const val = parseFloat(bhpMatch[1]);
      const unit = bhpMatch[2];
      const rpmMatch = s.match(/@\s*([\d,]+)\s*rpm/);
      const rpm = rpmMatch ? ` @ ${rpmMatch[1].replace(',', '')}rpm` : '';
      return `${val} ${unit}${rpm}`;
    }
    if (kwMatch) {
      const val = parseFloat(kwMatch[1]);
      const bhp = Math.round(val * 1.341);
      return `${bhp} bhp`;
    }
    return raw.trim();
  }

  static normalizeTorque(raw: string | undefined): string | undefined {
    if (!raw) return undefined;
    const s = raw.toLowerCase().trim();
    const match = s.match(/([\d.]+)\s*(nm|n\.m)/);
    if (!match) return raw.trim();
    const val = parseFloat(match[1]);
    const rpmMatch = s.match(/@\s*([\d,]+)\s*rpm/);
    const rpm = rpmMatch ? ` @ ${rpmMatch[1].replace(',', '')}rpm` : '';
    return `${val} Nm${rpm}`;
  }

  static normalizeDisplacement(raw: string | undefined): string | undefined {
    if (!raw) return undefined;
    const s = raw.toLowerCase().trim();
    const ccMatch = s.match(/([\d.]+)\s*cc/);
    const litreMatch = s.match(/([\d.]+)\s*(l|litre|liter|litres|liters)/);
    if (ccMatch) return `${parseFloat(ccMatch[1])} cc`;
    if (litreMatch) {
      const litres = parseFloat(litreMatch[1]);
      return `${Math.round(litres * 1000)} cc`;
    }
    return raw.trim();
  }

  static normalizeFuelType(raw: string | undefined): string | undefined {
    if (!raw) return undefined;
    const s = raw.toLowerCase().trim();
    const map: Record<string, string> = {
      petrol: 'Petrol',
      gasoline: 'Petrol',
      diesel: 'Diesel',
      electric: 'Electric',
      ev: 'Electric',
      'hybrid electric': 'Hybrid',
      hybrid: 'Hybrid',
      cng: 'CNG',
      'cng + petrol': 'CNG + Petrol',
      lpg: 'LPG',
    };
    for (const [key, val] of Object.entries(map)) {
      if (s.includes(key)) return val;
    }
    return raw.trim();
  }

  static normalizeTransmission(raw: string | undefined): string | undefined {
    if (!raw) return undefined;
    const s = raw.toLowerCase().trim();
    if (s.includes('manual') && !s.includes('auto')) return 'Manual';
    if (s.includes('automatic') || s.includes('auto')) return 'Automatic';
    if (s.includes('amt')) return 'AMT';
    if (s.includes('cvt')) return 'CVT';
    if (s.includes('dct')) return 'DCT';
    if (s.includes('dsg')) return 'DSG';
    if (s.includes('imt')) return 'IMT';
    return raw.trim();
  }

  static normalizePrice(raw: string | number | undefined): number | undefined {
    if (raw === undefined || raw === null) return undefined;
    if (typeof raw === 'number') return raw;
    const s = raw.toLowerCase().replace(/,/g, '').trim();
    // handles "₹9.50 lakh", "9.50 lakh", "950000"
    const lakhMatch = s.match(/([\d.]+)\s*lakh/);
    const croreMatch = s.match(/([\d.]+)\s*crore/);
    const numMatch = s.match(/([\d.]+)/);
    if (croreMatch) return Math.round(parseFloat(croreMatch[1]) * 10000000);
    if (lakhMatch) return Math.round(parseFloat(lakhMatch[1]) * 100000);
    if (numMatch) return parseInt(numMatch[1]);
    return undefined;
  }

  static normalizeSpecs(rawSpecs: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    const fieldNormalizers: Record<string, (v: any) => any> = {
      mileage: this.normalizeMileage.bind(this),
      arai_mileage: this.normalizeMileage.bind(this),
      fuel_efficiency: this.normalizeMileage.bind(this),
      max_power: this.normalizePower.bind(this),
      power: this.normalizePower.bind(this),
      max_torque: this.normalizeTorque.bind(this),
      torque: this.normalizeTorque.bind(this),
      displacement: this.normalizeDisplacement.bind(this),
      engine_displacement: this.normalizeDisplacement.bind(this),
      fuel_type: this.normalizeFuelType.bind(this),
      transmission: this.normalizeTransmission.bind(this),
      price: this.normalizePrice.bind(this),
      ex_showroom_price: this.normalizePrice.bind(this),
    };

    for (const [key, value] of Object.entries(rawSpecs)) {
      const normalizer = fieldNormalizers[key.toLowerCase()];
      result[key] = normalizer ? normalizer(value) : value;
    }
    return result;
  }
}
