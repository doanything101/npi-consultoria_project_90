"use client";
import AuthCheck from "../components/auth-check";
import { useEffect, useState } from "react";
import HomeTab from "./components/tabs/home-tab";
import HubTab from "./components/tabs/hub-tab";
import SobreTab from "./components/tabs/sobre-tab";
import ServicosTab from "./components/tabs/servicos-tab";

export default function GerenciarSite() {
  const [tab, setTab] = useState("home");
  const [form, setForm] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/admin/content");
        if (!res.ok) {
          throw new Error("Falha ao carregar conteúdo");
        }
        const data = await res.json();
        setForm(data.data);
        console.log("📊 DADOS CARREGADOS:", data.data);
      } catch (error) {
        console.error("Erro ao carregar conteúdo:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Funções simples que não fazem nada para não quebrar os outros tabs
  const updateForm = (field, value) => {
    console.log(`Campo atualizado: ${field} = ${value}`);
  };

  const updateNestedForm = (section, field, value) => {
    console.log(`Campo aninhado atualizado: ${section}.${field} = ${value}`);
  };

  return (
    <AuthCheck>
      <div className="mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Gerenciar Site</h1>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {[
            { key: "home", label: "Home" },
            { key: "hub", label: "Conheça o Hub" },
            { key: "sobre", label: "Sobre a NPI" },
            { key: "servicos", label: "Nossos Serviços" },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`px-4 py-2 rounded-t-md font-semibold border-b-2 transition-colors ${
                tab === key
                  ? "border-black text-black bg-gray-50"
                  : "border-transparent text-gray-400 bg-gray-100"
              }`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[200px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {tab === "home" && (
                <HomeTab 
                  form={form.home || {}} 
                  updateForm={updateForm}
                />
              )}
              {tab === "hub" && (
                <HubTab 
                  form={form.hub || {}} 
                  updateForm={updateForm}
                />
              )}
              {tab === "sobre" && (
                <SobreTab 
                  form={form.sobre || {}} 
                  updateForm={updateForm}
                />
              )}
              {tab === "servicos" && (
                <ServicosTab 
                  form={form}
                  updateForm={updateForm}
                  updateNestedForm={updateNestedForm}
                />
              )}
            </>
          )}
        </div>
      </div>
    </AuthCheck>
  );
}
