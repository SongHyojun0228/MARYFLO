"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface RealtimeListenerProps {
  businessId: string;
}

export function RealtimeListener({ businessId }: RealtimeListenerProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`leads-${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Lead",
          filter: `businessId=eq.${businessId}`,
        },
        (payload) => {
          const lead = payload.new as { name?: string };
          toast.info(`새 문의: ${lead.name ?? "고객"}님`, {
            action: {
              label: "확인",
              onClick: () => router.push("/dashboard/leads"),
            },
          });
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, router]);

  return null;
}
