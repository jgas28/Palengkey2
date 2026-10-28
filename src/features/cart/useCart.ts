import { useQuery } from "@tanstack/react-query";
import { getCart } from "@/services/api/cart";

export const cartQueryKey = ["cart"];

/** Works for both guests (device-id keyed cart) and authenticated customers —
 * CartController::resolveCart branches on which the request carries. */
export function useCart() {
  return useQuery({
    queryKey: cartQueryKey,
    queryFn: () => getCart(),
    // Availability can change while the basket is open.
    refetchOnMount: "always",
    refetchInterval: 60_000,
  });
}
