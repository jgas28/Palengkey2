import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import OrderCard from "@/features/orders/OrderCard";
import { listOrders } from "@/services/api/orders";

export default function Orders() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["orders"],
    queryFn: ({ pageParam }) => listOrders(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.current_page < lastPage.last_page ? lastPage.current_page + 1 : undefined,
  });

  const orders = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h1 className="text-lg font-bold text-text">Orders</h1>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {!isLoading && !isError && orders.length === 0 && (
        <EmptyState
          icon={<span className="text-5xl">🧾</span>}
          title="No orders yet."
          description="Your orders will appear here once you place one."
        />
      )}

      {!isLoading && !isError && orders.length > 0 && (
        <>
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>

          {hasNextPage && (
            <Button
              variant="secondary"
              loading={isFetchingNextPage}
              onClick={() => void fetchNextPage()}
            >
              Load more
            </Button>
          )}
        </>
      )}
    </div>
  );
}
