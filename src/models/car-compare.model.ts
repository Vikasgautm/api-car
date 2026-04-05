import { Schema, model, Document } from 'mongoose';

export interface ICarInfo {
  brand: string;
  model: string;
  price_min: number;
  price_max: number;
}

export interface ICarCompare extends Document {
  car_compare_id: string;
  car1: ICarInfo;
  car2: ICarInfo;
  image: Array<{
    preview: string;
    title: string;
  }>;
  comparison_title: string;
  route_link: string;
  is_published: boolean;
  is_deleted: boolean;
}

const carInfoSchema = new Schema(
  {
    brand: { type: String, required: true },
    model: { type: String, required: true },
    price_min: { type: Number, required: true },
    price_max: { type: Number, required: true },
  },
  { _id: false }
);

const carCompareSchema = new Schema<ICarCompare>(
  {
    car_compare_id: { type: String, required: true, unique: true },
    car1: { type: carInfoSchema, required: true },
    car2: { type: carInfoSchema, required: true },
    image: {
      type: [
        {
          preview: { type: String },
          title: { type: String },
        },
      ],
      required: true,
    },
    comparison_title: { type: String, required: true },
    route_link: { type: String, required: true },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const CarCompare = model<ICarCompare>('CarCompare', carCompareSchema);
