export interface PlanBody {
  name: string;
  features: string[];
  tags: string[];
  description: string;
  amount: number;
  currency: "USD" | "INR";
  duration: "monthly" | "yearly";
}
export interface PlanData {
  _id: string;
  name: string;
  features: string[];
  tags: string[];
  description: string;
  amount: number;
  currency: "USD" | "INR";
  duration: "monthly" | "yearly";
}
