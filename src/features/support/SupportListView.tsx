import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, HelpCircle, Mail, MessageCircle } from "lucide-react";
import { Spinner } from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { getSupportOverview, openSupportForOrder } from "@/services/api/support";
import { useToastStore } from "@/stores/toastStore";
import type { SupportableOrder } from "@/types/support";

export default function SupportListView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["support"],
    queryFn: getSupportOverview,
  });

  const openMutation = useMutation({
    mutationFn: (order: SupportableOrder) => openSupportForOrder(order.order_number),
    onSuccess: (thread) => {
      void queryClient.invalidateQueries({ queryKey: ["support"] });
      navigate(`/support/${thread.id}`);
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not start a conversation.",
        "error",
      );
    },
  });

  const ordersWithoutThread = data?.orders.filter((order) => !order.supportThread) ?? [];

  return (
    <div className="-mx-4 -mt-4 min-h-full bg-[#F7FAFA] pb-10 md:-mx-6">
      <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-30 border-b border-[#DDE9EA] bg-white lg:top-[calc(5rem+env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            to="/profile"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#DDE9EA] bg-[#F7FAFA] text-[#66777C] transition-colors hover:text-[#203238]"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div>
            <h1 className="font-display text-lg font-bold text-[#203238]">Help &amp; Support</h1>
            <p className="text-xs text-[#66777C]">We&apos;re here to help you</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-5 sm:px-6">
        {/* Contact options */}
        <div className="grid grid-cols-3 gap-3">
          <a
            href="#conversations"
            className="flex flex-col items-center gap-2 rounded-2xl border border-[#DDE9EA] bg-white p-4 text-center transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F7F7] text-[#0097A7]">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-sm font-semibold leading-tight text-[#203238]">
              Message Us
            </span>
            <span className="text-[10px] leading-tight text-[#66777C]">Per-order chat</span>
          </a>
          <a
            href="mailto:contact@palengkey.ph"
            className="flex flex-col items-center gap-2 rounded-2xl border border-[#DDE9EA] bg-white p-4 text-center transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F7EE] text-[#159447]">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-sm font-semibold leading-tight text-[#203238]">Email Us</span>
            <span className="text-[10px] leading-tight text-[#66777C]">
              contact@palengkey.ph
            </span>
          </a>
          <Link
            to="/faq"
            className="flex flex-col items-center gap-2 rounded-2xl border border-[#DDE9EA] bg-white p-4 text-center transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3EFFE] text-[#7C3AED]">
              <HelpCircle className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-sm font-semibold leading-tight text-[#203238]">
              Help Center
            </span>
            <span className="text-[10px] leading-tight text-[#66777C]">FAQs</span>
          </Link>
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}

        {isError && <ErrorState onRetry={() => void refetch()} />}

        {data && (
          <div id="conversations" className="space-y-5">
            {data.threads.length === 0 && ordersWithoutThread.length === 0 && (
              <EmptyState
                icon={<MessageCircle size={40} aria-hidden="true" />}
                title="No support conversations yet."
                description="Once you have an order, you can reach out here if you need help."
              />
            )}

            {data.threads.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-[#DDE9EA] bg-white shadow-sm">
                <div className="border-b border-[#DDE9EA] px-5 py-4">
                  <h2 className="font-display font-bold text-[#203238]">
                    Your conversations
                  </h2>
                </div>
                <div className="divide-y divide-[#DDE9EA]">
                  {data.threads.map((thread) => (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => navigate(`/support/${thread.id}`)}
                      className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-[#F7FAFA]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F7F7] text-[#0097A7]">
                        <MessageCircle size={18} aria-hidden="true" />
                      </span>
                      <span className="flex min-w-0 flex-col items-start gap-0.5">
                        <span className="text-sm font-semibold text-[#203238]">
                          {thread.subject}
                        </span>
                        {thread.latestMessage && (
                          <span className="line-clamp-1 text-sm text-[#66777C]">
                            {thread.latestMessage.body}
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {ordersWithoutThread.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-[#DDE9EA] bg-white shadow-sm">
                <div className="border-b border-[#DDE9EA] px-5 py-4">
                  <h2 className="font-display font-bold text-[#203238]">
                    Get help with an order
                  </h2>
                </div>
                <div className="divide-y divide-[#DDE9EA]">
                  {ordersWithoutThread.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      disabled={openMutation.isPending}
                      onClick={() => openMutation.mutate(order)}
                      className="flex w-full items-center justify-between gap-2 px-5 py-4 text-left text-sm transition-colors hover:bg-[#F7FAFA] disabled:opacity-50"
                    >
                      <span className="font-medium text-[#203238]">
                        Order #{order.order_number}
                      </span>
                      <span className="font-semibold text-[#0097A7]">Start conversation</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
