export type Num = string | number;
export type FractionJSON = { n: string; d: string };
export interface Supplier {supplier_id:string;name:string;data_class?:string}
export interface Material {material_id:string;name:string;unit:'g'|'ml'|'개';pack_quantity:Num;base_pack_price:Num;lead_days:number;safety_days:number;supplier_id:string}
export interface Menu {menu_id:string;name:string;price:Num;category:string;recipe_version:string}
export interface Recipe {recipe_version:string;menu_id:string;material_id:string;quantity:Num;unit:string;channel_only?:string}
export interface Price {material_id:string;effective_date:string;pack_price:Num;pack_quantity:Num}
export interface Sale {sale_id:string;date:string;menu_id:string;channel:'매장'|'포장';quantity:Num;unit_price:Num;discount_amount:Num;net_sales:Num;payment_fee:Num;recipe_version:string;unit_food_cost_snapshot:Num;unit_packaging_cost_snapshot:Num;cost_fractions?:{food:FractionJSON;pack:FractionJSON};row_version?:number}
export interface InventoryEvent {event_id:string;date:string;material_id:string;event_type:string;quantity:Num;unit:string;reason:string;counted_quantity?:Num;unit_cost?:Num;supplier_id?:string}
export interface Expense {expense_id:string;date:string;category:string;amount:Num;recognition:string;row_version?:number}
export interface Calendar {date:string;is_open:boolean;record_complete:boolean;weather:string;note:string}
export interface Dataset {meta:Record<string,unknown>;settings:Record<string,unknown>;suppliers:Supplier[];materials:Material[];menus:Menu[];recipes:Recipe[];price_history:Price[];calendar:Calendar[];sales:Sale[];opening_inventory:{material_id:string;date:string;quantity:Num;unit:string}[];inventory_events:InventoryEvent[];expenses:Expense[];monthly_expense_plan:{month:string;category:string;amount:Num}[]}
export type SaleInput = {date:string;menu_id:string;channel:'매장'|'포장';quantity:string;unit_price:string;discount_amount:string;payment_fee:string};
