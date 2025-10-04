"use client";

import { useEffect, useState } from "react";
import AuthCheck from "../components/auth-check";
import { addUsuario, getUsuarios, updateDadosUsuario, deleteUsuario } from "../services/usuarios";
import { FaEdit, FaTrash } from "react-icons/fa";
import Modal from "../components/modal";

// Disable static generation for admin pages
export const dynamic = 'force-dynamic';

export default function Configuracoes() {
  const [formData, setFormData] = useState({
    nome_site: "NPI Imóveis",
    email_contato: "npi@npiconsultoria.com.br",
    telefone: "(11) 2614-4414",
    endereco: "Rua George Ohm, 206P",
    whatsapp: "(11)96915-2222",
    instagram: "@npiimoveis",
    facebook: "facebook.com/npiimoveis",
    imoveis_por_pagina: "12",
    meta_description: "NPI Imóveis - Encontre seu imóvel ideal em São Paulo e região",
    google_analytics: "UA-12345678-1",
    cores: {
      primaria: "#000000",
      secundaria: "#2563EB",
      destaque: "#FBBF24",
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [novoUsuario, setNovoUsuario] = useState({ email: "", password: "", displayName: "" });
  const [showEdit, setShowEdit] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [editData, setEditData] = useState({ displayName: "", password: "" });
  const [showDelete, setShowDelete] = useState(false);
  const [usuarioDeletando, setUsuarioDeletando] = useState(null);

  useEffect(() => {
    async function fetchUsuarios() {
      const { data } = await getUsuarios();
      setUsuarios(data?.users || []);
      console.log("Usuarios", data?.users);
    }
    fetchUsuarios();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const res = await addUsuario(novoUsuario);
    if (res.success) {
      setShowAdd(false);
      setNovoUsuario({ email: "", password: "", displayName: "" });
      // Atualiza lista
      const { data } = await getUsuarios();
      setUsuarios(data?.users || []);
    } else {
      alert(res.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Verificar se é um campo aninhado (cores)
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulação de salvamento
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);

      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    }, 1000);

    // Em uma implementação real, você enviaria os dados para a API
  };

  const handleEditClick = (user) => {
    setUsuarioEditando(user);
    setEditData({ displayName: user.displayName || "", password: "" });
    setShowEdit(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    let success = true;
    let msg = "";

    // Atualiza senha se preenchida

    const res = await updateDadosUsuario({
      uid: usuarioEditando.uid,
      displayName: editData.displayName,
      password: editData.password,
    });
    if (!res.success) {
      msg = res.message;
      success = false;
    }

    if (success) {
      setShowEdit(false);
      setUsuarioEditando(null);
      setEditData({ displayName: "", password: "" });
      const { data } = await getUsuarios();
      setUsuarios(data?.users || []);
    } else {
      alert(msg || "Erro ao editar usuário");
    }
  };

  const handleDeleteClick = (user) => {
    setUsuarioDeletando(user);
    setShowDelete(true);
  };

  const handleDelete = async () => {
    if (!usuarioDeletando) return;
    const res = await deleteUsuario(usuarioDeletando.uid);
    if (res.success) {
      setShowDelete(false);
      setUsuarioDeletando(null);
      const { data } = await getUsuarios();
      setUsuarios(data?.users || []);
    } else {
      alert(res.message || "Erro ao deletar usuário");
    }
  };

  return (
    <AuthCheck>
      <div className="w-full mx-auto text-xs">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Configurações do Site</h1>
          <p className="text-gray-600 mb-6">
            Configure as informações gerais do site, contato e aparência.
          </p>
          <div className="bg-white  rounded-lg overflow-hidden p-6 mb-6">
            <div className="flex justify-between items-center">
              <h2 className="font-bold mb-4  ">Gerenciar Usuários</h2>
              <button
                className="bg-black  text-white px-4 py-2 rounded"
                onClick={() => setShowAdd(!showAdd)}
              >
                Adicionar Novo Usuário
              </button>
            </div>

            {showAdd && (
              <Modal title="Adicionar Novo Usuário" onClose={() => setShowAdd(false)}>
                <form onSubmit={handleAdd} className="flex flex-col gap-3 w-full">
                  <input
                    type="text"
                    placeholder="Nome"
                    value={editData.displayName}
                    onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                    className="border px-5 py-2 text-zinc-700 w-full rounded-md focus:outline-none focus:ring-black focus:border-black"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={novoUsuario.email}
                    onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
                    className="border px-5 py-2 text-zinc-700 w-full rounded-md focus:outline-none focus:ring-black focus:border-black"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Senha"
                    value={novoUsuario.password}
                    onChange={(e) => setNovoUsuario({ ...novoUsuario, password: e.target.value })}
                    className="border px-5 py-2 text-zinc-700 w-full rounded-md focus:outline-none focus:ring-black focus:border-black"
                    required
                  />
                  <div className="flex gap-2 justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => setShowAdd(false)}
                      className="border px-4 py-2 rounded-md"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="bg-black text-white px-4 py-2 rounded-md">
                      Adicionar Usuário
                    </button>
                  </div>
                </form>
              </Modal>
            )}
            <div className="space-y-4 mt-6">
              {usuarios.map((user) => (
                <div
                  key={user.uid}
                  className="w-full grid grid-cols-4 bg-zinc-100 px-4 py-2 rounded-lg gap-2 "
                >
                  <h1 className="font-bold text-xs">{user.displayName || "Sem nome"}</h1>
                  <p className="text-xs ">{user.email}</p>
                  <p className="text-xs ">
                    Criado em:
                    {new Date(user.creationTime).toLocaleDateString()}
                  </p>
                  <div className="flex justify-end gap-2 mt-2">
                    <button className="text-blue-600" onClick={() => handleEditClick(user)}>
                      <FaEdit size={18} />
                    </button>
                    <button className="text-red-600" onClick={() => handleDeleteClick(user)}>
                      <FaTrash size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Gerais */}
            <div className="bg-white  rounded-lg overflow-hidden p-6">
              <h2 className="font-semibold mb-4 text-gray-800 border-b pb-2">Informações Gerais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nome_site" className="block font-medium text-gray-700 mb-1">
                    Nome do Site
                  </label>
                  <input
                    type="text"
                    id="nome_site"
                    name="nome_site"
                    value={formData.nome_site}
                    onChange={handleChange}
                    className="border px-5 py-2 text-zinc-700 w-full rounded-md focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
                <div>
                  <label
                    htmlFor="meta_description"
                    className="block font-medium text-gray-700 mb-1"
                  >
                    Meta Description
                  </label>
                  <input
                    type="text"
                    id="meta_description"
                    name="meta_description"
                    value={formData.meta_description}
                    onChange={handleChange}
                    className="border px-5 py-2 text-zinc-700 w-full rounded-md focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
                <div>
                  <label
                    htmlFor="imoveis_por_pagina"
                    className="block font-medium text-gray-700 mb-1"
                  >
                    Imóveis por Página
                  </label>
                  <input
                    type="number"
                    id="imoveis_por_pagina"
                    name="imoveis_por_pagina"
                    value={formData.imoveis_por_pagina}
                    onChange={handleChange}
                    min="1"
                    max="100"
                    className="border px-5 py-2 text-zinc-700 w-full rounded-md focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
                <div>
                  <label
                    htmlFor="google_analytics"
                    className="block font-medium text-gray-700 mb-1"
                  >
                    ID do Google Analytics
                  </label>
                  <input
                    type="text"
                    id="google_analytics"
                    name="google_analytics"
                    value={formData.google_analytics}
                    onChange={handleChange}
                    className="border px-5 py-2 text-zinc-700 w-full rounded-md focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="bg-white  rounded-lg overflow-hidden p-6">
              <h2 className="font-semibold mb-4 text-gray-800 border-b pb-2">Contato</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email_contato" className="block font-medium text-gray-700 mb-1">
                    E-mail de Contato
                  </label>
                  <input
                    type="email"
                    id="email_contato"
                    name="email_contato"
                    value={formData.email_contato}
                    onChange={handleChange}
                    className="border px-5 py-2 text-zinc-700 w-full rounded-md focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
                <div>
                  <label htmlFor="telefone" className="block font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    id="telefone"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    className="border px-5 py-2 text-zinc-700 w-full rounded-md focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
                <div>
                  <label htmlFor="whatsapp" className="block font-medium text-gray-700 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    id="whatsapp"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    className="border px-5 py-2 text-zinc-700 w-full rounded-md focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
                <div>
                  <label htmlFor="endereco" className="block font-medium text-gray-700 mb-1">
                    Endereço
                  </label>
                  <input
                    type="text"
                    id="endereco"
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleChange}
                    className="border px-5 py-2 text-zinc-700 w-full rounded-md focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
              </div>
            </div>

            {/* Redes Sociais */}
            <div className="bg-white  rounded-lg overflow-hidden p-6">
              <h2 className="font-semibold mb-4 text-gray-800 border-b pb-2">Redes Sociais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="instagram" className="block font-medium text-gray-700 mb-1">
                    Instagram
                  </label>
                  <input
                    type="text"
                    id="instagram"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                    className="border px-5 py-2 text-zinc-700 w-full rounded-md focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
                <div>
                  <label htmlFor="facebook" className="block font-medium text-gray-700 mb-1">
                    Facebook
                  </label>
                  <input
                    type="text"
                    id="facebook"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleChange}
                    className="border px-5 py-2 text-zinc-700 w-full rounded-md focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className={`inline-flex items-center px-5 py-2 border border-transparent font-medium rounded-md shadow-sm text-white ${
                  isLoading ? "bg-gray-500" : "bg-black hover:bg-gray-800"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
              >
                {isLoading ? "Salvando..." : "Salvar Configurações"}
              </button>
            </div>

            {/* Mensagem de sucesso */}
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-green-700">Configurações salvas com sucesso!</p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
      {showEdit && usuarioEditando && (
        <Modal title="Editar Usuário" onClose={() => setShowEdit(false)}>
          <form onSubmit={handleEdit} className="flex flex-col gap-3 w-full">
            <input
              type="text"
              placeholder="Nome"
              value={editData.displayName}
              onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
              className="border px-5 py-2 text-zinc-700 w-full rounded-md focus:outline-none focus:ring-black focus:border-black"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={usuarioEditando.email}
              className="border px-5 py-2 text-zinc-700 w-full rounded-md focus:outline-none focus:ring-black focus:border-black"
              disabled
            />
            <input
              type="password"
              placeholder="Nova senha (opcional)"
              value={editData.password}
              onChange={(e) => setEditData({ ...editData, password: e.target.value })}
              className="border px-5 py-2 text-zinc-700 w-full rounded-md focus:outline-none focus:ring-black focus:border-black"
            />
            <div className="flex gap-2 justify-end mt-2">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="border px-4 py-2 rounded-md"
              >
                Cancelar
              </button>
              <button type="submit" className="bg-black text-white px-4 py-2 rounded-md">
                Salvar Alterações
              </button>
            </div>
          </form>
        </Modal>
      )}
      {showDelete && usuarioDeletando && (
        <Modal title="Remover Usuário" onClose={() => setShowDelete(false)}>
          <div className="mb-4">
            Tem certeza que deseja remover o usuário{" "}
            <b>{usuarioDeletando.displayName || usuarioDeletando.email}</b>?
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              onClick={() => setShowDelete(false)}
              className="border px-4 py-2 rounded-md"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-md"
            >
              Remover
            </button>
          </div>
        </Modal>
      )}
    </AuthCheck>
  );
}
