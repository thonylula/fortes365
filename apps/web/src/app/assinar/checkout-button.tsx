"use client";

import { useState } from "react";

export function CheckoutButton({
  plan,
  highlight,
}: {
  plan: string;
  highlight?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mp/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      const url = data.sandbox_url ?? data.checkout_url;
      if (url) window.location.href = url;
    } catch {
      alert("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="mt-4 w-full rounded-md py-2.5 font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
      style={
        highlight
          ? { background: "var(--or)", color: "#000" }
          : { background: "var(--s3)", color: "var(--tx2)", border: "1px solid var(--bd)" }
      }
    >
      {loading ? "Redirecionando..." : "Assinar"}
    </button>
  );
}
