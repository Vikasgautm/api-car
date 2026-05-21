import { BodyType } from '../../../models/body-type.model';
import { FuelType } from '../../../models/fuel-type.model';
import { ISeoFaqItem, SeoCollectionType } from '../../../models/seo-collection.model';

export class SeoFaqService {
  static async generateFaqs(
    collection_type: SeoCollectionType,
    params: {
      fuel_type_ids?: string[];
      body_type_ids?: string[];
      budget_max?: number | null;
      transmission_types?: string[];
      mileage_classes?: string[];
    }
  ): Promise<ISeoFaqItem[]> {
    const faqs: ISeoFaqItem[] = [];

    const fuelNames = params.fuel_type_ids?.length
      ? (await FuelType.find({ fuel_type_id: { $in: params.fuel_type_ids } }).select('name').lean()).map((ft: any) => ft.name)
      : [];

    const bodyNames = params.body_type_ids?.length
      ? (await BodyType.find({ body_type_id: { $in: params.body_type_ids } }).select('name').lean()).map((bt: any) => bt.name)
      : [];

    const fuel = fuelNames.join(' or ') || 'petrol';
    const body = bodyNames.join(' or ') || 'car';
    const budgetStr = params.budget_max
      ? `under ₹${(params.budget_max / 100000).toFixed(0)} lakh`
      : 'in India';

    faqs.push({
      question: `What are the best ${fuel} ${body} cars ${budgetStr}?`,
      answer: `CarSalahakar lists all available ${fuel} ${body} cars ${budgetStr} with up-to-date prices, mileage, specs and features. Use the filters to narrow down by transmission, seating, and budget.`,
    });

    const fuelLower = fuelNames.map(f => f.toLowerCase());

    if (fuelLower.includes('petrol')) {
      faqs.push({
        question: 'What is the mileage of petrol cars in India?',
        answer: 'Petrol cars in India typically deliver between 12 km/l and 25 km/l depending on engine size and driving conditions. Small hatchbacks tend to give better mileage than larger SUVs.',
      });
    }

    if (fuelLower.includes('diesel')) {
      faqs.push({
        question: 'Are diesel cars worth buying in 2025?',
        answer: 'Diesel cars offer better fuel efficiency for long-distance and highway driving. They are ideal if you cover more than 1,500 km per month. For city driving, petrol or CNG may be more cost-effective.',
      });
    }

    if (fuelLower.some(f => f.includes('ev') || f.includes('electric'))) {
      faqs.push({
        question: 'What is the range of electric cars in India?',
        answer: 'Electric cars in India offer a range of 200 km to 700+ km on a full charge depending on the model. Tata, MG, Hyundai, and Kia offer popular EV options across different budgets.',
      });
    }

    if (fuelLower.includes('cng')) {
      faqs.push({
        question: 'Which CNG cars are best for daily commuting?',
        answer: 'CNG cars are ideal for city commuting due to very low running costs. Popular options include Maruti Suzuki WagonR CNG, Tata Tiago CNG, and Hyundai Aura CNG.',
      });
    }

    if (params.transmission_types?.includes('automatic') || params.transmission_types?.includes('amt')) {
      faqs.push({
        question: 'Which automatic cars are best for city driving?',
        answer: 'Automatic cars with AMT or torque converter transmissions are ideal for stop-and-go city traffic. They eliminate clutch fatigue and are now available across all budget segments in India.',
      });
    }

    if (params.mileage_classes?.includes('excellent') || params.mileage_classes?.includes('good')) {
      faqs.push({
        question: 'Which cars give the best mileage in India?',
        answer: 'Among petrol cars, Maruti Suzuki and Hyundai models consistently top the mileage charts. For diesel, Maruti Ertiga and Toyota Innova are popular high-mileage options.',
      });
    }

    if (params.budget_max) {
      faqs.push({
        question: `What features can I expect in cars ${budgetStr}?`,
        answer: `Cars priced ${budgetStr} typically offer touchscreen infotainment, rearview cameras, and automatic climate control in top variants. Many models also include 6+ airbags and ADAS in higher trims.`,
      });
    }

    faqs.push({
      question: 'How to compare cars on CarSalahakar?',
      answer: 'Use the Compare feature on CarSalahakar to compare up to 3 cars side by side across price, specs, mileage, features, safety ratings, and more.',
    });

    return faqs;
  }
}
