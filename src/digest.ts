import {z} from "zod";

export const workOrder = z.object({id: z.string(), site: z.string(), status: z.enum(["dispatched", "en_route", "complete"]), photoUrl: z.string().url().optional(), followUp: z.boolean()});
export type WorkOrder = z.infer<typeof workOrder>;

export function buildDigest(orders: WorkOrder[]): string | null {
  const followUps = orders.filter(order => order.followUp && order.status !== "complete");
  if (followUps.length === 0) return null;
  return followUps.map(order => `${order.id} | ${order.site} | ${order.status}${order.photoUrl ? ` | photo: ${order.photoUrl}` : ""}`).join("\n");
}
