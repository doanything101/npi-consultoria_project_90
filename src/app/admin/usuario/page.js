"use client";

import { useState, useEffect } from "react";
import { auth } from "@/app/lib/firebase";
import {
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import AuthCheck from "../components/auth-check";

// Disable static generation for admin pages
export const dynamic = 'force-dynamic';

export default function UsuarioPage() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    senhaAtual: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    // Carregar dados do usuário atual
    const user = auth.currentUser;
    if (user) {
      setFormData((prev) => ({
        ...prev,
        nome: user.displayName || "",
        email: user.email || "",
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado");

      // Se houver alteração de email ou senha, precisa reautenticar
      if ((formData.email !== user.email || formData.senha) && !formData.senhaAtual) {
        throw new Error("Senha atual é necessária para alterar email ou senha");
      }

      // Array para armazenar as promessas de atualização
      const updatePromises = [];

      // Atualizar nome de exibição se foi alterado
      if (formData.nome !== user.displayName) {
        updatePromises.push(
          updateProfile(user, {
            displayName: formData.nome,
          })
        );
      }

      // Se email ou senha foram alterados, reautenticar primeiro
      if (formData.email !== user.email || formData.senha) {
        const credential = EmailAuthProvider.credential(user.email, formData.senhaAtual);
        await reauthenticateWithCredential(user, credential);

        // Atualizar email se foi alterado
        if (formData.email !== user.email) {
          updatePromises.push(updateEmail(user, formData.email));
        }

        // Atualizar senha se foi fornecida
        if (formData.senha) {
          updatePromises.push(updatePassword(user, formData.senha));
        }
      }

      // Executar todas as atualizações
      await Promise.all(updatePromises);

      setMessage({
        type: "success",
        text: "Dados atualizados com sucesso!",
      });

      // Limpar campos de senha
      setFormData((prev) => ({
        ...prev,
        senha: "",
        senhaAtual: "",
      }));
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      setMessage({
        type: "error",
        text:
          error.message === "Senha atual é necessária para alterar email ou senha"
            ? error.message
            : "Erro ao atualizar dados. Verifique suas credenciais e tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCheck>
      <div className="w-full mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Dados Pessoais</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className="border-2 px-3 py-2 text-gray-700 w-full rounded-md focus:outline-none focus:ring-black focus:border-black"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="border-2 px-3 py-2 text-gray-700 w-full rounded-md focus:outline-none focus:ring-black focus:border-black"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label htmlFor="senhaAtual" className="block text-sm font-medium text-gray-700 mb-1">
                Senha Atual
              </label>
              <input
                type="password"
                id="senhaAtual"
                name="senhaAtual"
                value={formData.senhaAtual}
                onChange={handleChange}
                className="border-2 px-3 py-2 text-gray-700 w-full rounded-md focus:outline-none focus:ring-black focus:border-black"
                placeholder="Digite sua senha atual"
              />
            </div>
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
                Nova Senha
              </label>
              <input
                type="password"
                id="senha"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                className="border-2 px-3 py-2 text-gray-700 w-full rounded-md focus:outline-none focus:ring-black focus:border-black"
                placeholder="Digite nova senha"
              />
            </div>
          </div>

          {message.text && (
            <div
              className={`mt-4 p-3 rounded-md ${
                message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="w-full flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`mt-4 inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                loading ? "bg-gray-400" : "bg-black hover:bg-gray-800"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </AuthCheck>
  );
}
