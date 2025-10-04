"use client";
import AuthCheck from "../components/auth-check";
import { useEffect, useState } from "react";
import { deleteRedirect } from "../services/redirects";

// Disable static generation for admin pages
export const dynamic = 'force-dynamic';

export default function RedirectPage() {
  const [redirects, setRedirects] = useState([]);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Buscar redirects existentes
  useEffect(() => {
    fetch("/api/admin/redirects-list")
      .then((res) => res.json())
      .then((data) => setRedirects(data.redirects || []));
  }, [success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/redirect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, destination }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Redirect adicionado com sucesso!");
        setSource("");
        setDestination("");
      } else {
        setError(data.error || "Erro ao adicionar redirect");
      }
    } catch (err) {
      setError("Erro ao adicionar redirect");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (source) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await deleteRedirect(source);
      setSuccess("Redirect removido com sucesso!");
    } catch (err) {
      setError("Erro ao remover redirect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCheck>
      <div className="mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Gerenciar Redirecionamentos</h1>
        <p className="mb-4">
          Aqui você pode visualizar e adicionar redirecionamentos do seu site.{" "}
        </p>

        <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-2 bg-white p-4 rounded">
          <div className="flex gap-2">
            <input
              className="border p-2 rounded w-1/2"
              placeholder="/source-path/"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              required
            />
            <input
              className="border p-2 rounded w-1/2"
              placeholder="/destination-path/"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-black text-white px-4 py-2 rounded font-bold hover:bg-gray-800"
              disabled={loading}
            >
              {loading ? "Adicionando..." : "Adicionar"}
            </button>
          </div>
          {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
          {success && <div className="text-green-600 text-xs mt-1">{success}</div>}
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded ">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Source</th>
                <th className="px-4 py-2 text-left">Destination</th>
                <th className="px-4 py-2 text-left">Permanent</th>
                <th className="px-4 py-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {redirects.map((r, i) => (
                <tr key={r.source + r.destination + i} className="border-t">
                  <td className="px-4 py-2 font-mono text-xs">{r.source}</td>
                  <td className="px-4 py-2 font-mono text-xs">{r.destination}</td>
                  <td className="px-4 py-2">{r.permanent ? "Sim" : "Não"}</td>
                  <td className="px-4 py-2">
                    <button
                      className="text-red-600 hover:underline text-xs"
                      onClick={() => handleDelete(r.source)}
                      disabled={loading}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthCheck>
  );
}
