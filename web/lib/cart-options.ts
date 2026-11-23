export const MILK_OPTIONS = ["whole", "lactose_free", "oat"] as const;
export type MilkOption = (typeof MILK_OPTIONS)[number];
export const GLAZE_OPTIONS = ["glazed", "plain"] as const;
export type GlazeOption = (typeof GLAZE_OPTIONS)[number];
export const COFFEE_OPTIONS = ["espresso", "americano", "cappuccino", "flat_white", "iced_latte"] as const;
export type CoffeeOption = (typeof COFFEE_OPTIONS)[number];
export type DrinkTemp = "hot" | "cold";
export type RollsOpts = { glaze: GlazeOption; warm: boolean };
export type CartOpts = { milk?: MilkOption; glaze?: GlazeOption; warm?: boolean; temp?: DrinkTemp; coffee?: CoffeeOption };
export type Fulfillment = "pickup" | "delivery";

export const coffeeUsesMilk = (coffee: CoffeeOption) => coffee === "cappuccino" || coffee === "flat_white" || coffee === "iced_latte";
export const coffeeIsAmericano = (coffee: CoffeeOption) => coffee === "americano";
