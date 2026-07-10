// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { toast } from "sonner";
// import {
//   productStore,
//   productTypeStore,
//   customerStore,
//   orderStore,
//   billStore,
//   alertStore,
//   restrictionStore,
// } from "./store";

// // ─── Query keys ──────────────────────────────────────────────────────────────
// export const qk = {
//   products: ["products"] as const,
//   productTypes: ["productTypes"] as const,
//   customers: ["customers"] as const,
//   orders: ["orders"] as const,
//   bills: ["bills"] as const,
//   alerts: ["alerts", "unread"] as const,
//   restrictions: ["restrictions"] as const,
// };

// // ─── Reads ───────────────────────────────────────────────────────────────────
// export const useProducts = () =>
//   useQuery({ queryKey: qk.products, queryFn: productStore.getAll });
// export const useProductTypes = () =>
//   useQuery({ queryKey: qk.productTypes, queryFn: productTypeStore.getAll });
// export const useCustomers = () =>
//   useQuery({ queryKey: qk.customers, queryFn: customerStore.getAll });
// export const useOrders = () =>
//   useQuery({ queryKey: qk.orders, queryFn: orderStore.getAll });
// export const useBills = () =>
//   useQuery({ queryKey: qk.bills, queryFn: billStore.getAll });
// export const useUnreadAlerts = () =>
//   useQuery({ queryKey: qk.alerts, queryFn: alertStore.getUnread });
// export const useRestrictions = () =>
//   useQuery({ queryKey: qk.restrictions, queryFn: restrictionStore.getAll });

// // ─── Mutation factory ────────────────────────────────────────────────────────
// type Invalidate = ReadonlyArray<ReadonlyArray<unknown>>;

// export function useEntityMutation<TArgs, TRes>(
//   fn: (args: TArgs) => Promise<TRes>,
//   opts: { successMsg?: string; errorMsg?: string; invalidate?: Invalidate } = {},
// ) {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: fn,
//     onSuccess: () => {
//       if (opts.successMsg) toast.success(opts.successMsg);
//       (opts.invalidate ?? []).forEach((key) =>
//         qc.invalidateQueries({ queryKey: key as readonly unknown[] }),
//       );
//     },
//     onError: (err: any) => {
//       toast.error(opts.errorMsg ?? err?.message ?? "Something went wrong");
//     },
//   });
// }


import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  productStore,
  productTypeStore,
  customerStore,
  orderStore,
  billStore,
  alertStore,
  restrictionStore,
} from "./store";

// ─── Query keys ──────────────────────────────────────────────────────────────
export const qk = {
  products: ["products"] as const,
  productTypes: ["productTypes"] as const,
  customers: ["customers"] as const,
  orders: ["orders"] as const,
  bills: ["bills"] as const,
  alerts: ["alerts", "unread"] as const,
  restrictions: ["restrictions"] as const,
};

// ─── Reads ───────────────────────────────────────────────────────────────────
export const useProducts = () =>
  useQuery({ queryKey: qk.products, queryFn: productStore.getAll });
export const useProductTypes = () =>
  useQuery({ queryKey: qk.productTypes, queryFn: productTypeStore.getAll });
export const useCustomers = () =>
  useQuery({ queryKey: qk.customers, queryFn: customerStore.getAll });
export const useOrders = () =>
  useQuery({ queryKey: qk.orders, queryFn: orderStore.getAll });
export const useBills = () =>
  useQuery({ queryKey: qk.bills, queryFn: billStore.getAll });
export const useUnreadAlerts = () =>
  useQuery({ queryKey: qk.alerts, queryFn: alertStore.getUnread });
export const useRestrictions = () =>
  useQuery({ queryKey: qk.restrictions, queryFn: restrictionStore.getAll });

// ─── Mutation factory ────────────────────────────────────────────────────────
type Invalidate = ReadonlyArray<ReadonlyArray<unknown>>;

export function useEntityMutation<TArgs, TRes extends { ok?: boolean; error?: string }>(
  fn: (args: TArgs) => Promise<TRes>,
  opts: { successMsg?: string; errorMsg?: string; invalidate?: Invalidate } = {},
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: TArgs) => {
      const res = await fn(args);
      // Our API client (wrappedFetch) resolves with {ok:false, error}
      // for backend-level rejections (validation, conflicts, locks, 404s)
      // instead of throwing — only network failures throw. Without this
      // check, onSuccess below would fire (with a success toast) even
      // when the server rejected the request.
      if (res && typeof res === 'object' && 'ok' in res && res.ok === false) {
        throw new Error(res.error || 'Request failed');
      }
      return res;
    },
    onSuccess: () => {
      if (opts.successMsg) toast.success(opts.successMsg);
      (opts.invalidate ?? []).forEach((key) =>
        qc.invalidateQueries({ queryKey: key as readonly unknown[] }),
      );
    },
    onError: (err: any) => {
      toast.error(err?.message || opts.errorMsg || "Something went wrong");
    },
  });
}