// FORÇANDO ATUALIZAÇÃO FINAL - 12:35
"use client";

import { useState, useEffect, useCallback } from "react";
import AuthCheck from "../components/auth-check";
import Pagination from "@/app/components/ui/pagination";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { getCorretores } from "../services";
import ModalDelete from "../components/modal-delete";
import { TrashIcon } from "lucide-react";

// Disable static generation for admin pages
export const dynamic = 'force-dynamic';

export default function AdminCorretores() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [corretores, setCorretores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [codigoCorretor, setCodigoCorretor] = useState("");
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 12,
  });

  const loadCorretores = useCallback(async (page = 1, search = "") => {
    setIsLoading(true);
    // Log para confirmar que a versão correta do arquivo está sendo executada
    console.log("Executando a versão correta do loadCorretores (sem o bug 'ReferenceError').");
    try {
      if (search) {
        const response = await fetch(`/api/search/corretores?q=${encodeURIComponent(search)}`);
        const result = await response.json();

        if (result && result.status === 200 && result.data) {
          setCorretores(result.data);
          setPagination(result.pagination || {
            totalItems: result.data.length,
            totalPages: 1,
            currentPage: 1,
            itemsPerPage: 20,
          });
        } else {
          setCorretores([]);
          setPagination({ totalItems: 0, totalPages: 1, currentPage: 1, itemsPerPage: 12 });
        }
      } else {
        const response = await getCorretores({}, page, 12);
        if (response && response.corretores) {
          setCorretores(response.corretores);
          setPagination({ ...response.pagination, itemsPerPage: 12 });
        } else {
          setCorretores([]);
          setPagination({ totalItems: 0, totalPages: 1, currentPage: 1, itemsPerPage: 12 });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar corretores:", error);
      setCorretores([]);
      setPagination({ totalItems: 0, totalPages: 1, currentPage: 1, itemsPerPage: 20 });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      loadCorretores(currentPage);
    }
  }, [currentPage, searchTerm, loadCorretores]);

  // Carrega corretores na primeira vez que a página abre
  useEffect(() => {
    loadCorretores(1);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadCorretores(1, searchTerm);
  };

  // ... O resto do arquivo é idêntico e pode ser copiado da sua versão ...
  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
    loadCorretores(1, "");
  };

  const handleEdit = (corretorId) => {
    router.push(`/admin/corretores/editar/${corretorId}`);
  };

  const handleDelete = async (codigo) => {
    setCodigoCorretor(codigo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    loadCorretores(currentPage, searchTerm);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (!searchTerm) {
      loadCorretores(page);
    } else {
      loadCorretores(page, searchTerm);
    }
  };

  return (
    <AuthCheck>
      {isModalOpen && (
        <ModalDelete
          id={codigoCorretor}
          title="Deletar Corretor"
          description={`O corretor será deletado da lista de parceiros. Tem certeza que deseja continuar?`}
          buttonText="Deletar"
          link="/admin/corretores"
          onClose={handleCloseModal}
          type="corretor"
        />
      )}
      <div className="">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Corretores</h1>
            <button
              onClick={() => router.push("/admin/corretores/editar/new")}
              className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              Cadastrar Novo Corretor
            </button>
          </div>

          <div className="bg-white p-4 rounded-lg mb-6">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome do corretor..."
                  className="border-2 px-5 py-2 text-zinc-700 pl-10 w-full rounded-md focus:outline-none focus:ring-black focus:border-black"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                Buscar
              </button>
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="inline-flex items-center px-5 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  Limpar
                </button>
              )}
            </form>
          </div>

          <div className="relative overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold tracking-wider capitalize">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold tracking-wider capitalize">Nome</th>
                  <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold tracking-wider">Celular</th>
                  <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold tracking-wider">Imóveis</th>
                  <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold tracking-wider sticky right-0 bg-gray-50">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  Array(10).fill(null).map((_, index) => (
                    <tr key={`loading-${index}`}>
                      <td colSpan={6} className="px-6 py-4 whitespace-nowrap">
                        <div className="animate-pulse flex space-x-4"><div className="h-4 bg-gray-200 rounded w-full"></div></div>
                      </td>
                    </tr>
                  ))
                ) : corretores?.length > 0 ? (
                  corretores.map((corretor) => (
                    <tr key={corretor._id} className="hover:bg-gray-50">
                      <td className="px-6 bg-gray-50 py-4 whitespace-nowrap text-[10px] text-gray-900 font-bold capitalize">{corretor.codigoD || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-[10px] text-gray-900 font-bold capitalize">{corretor.nomeCompleto || corretor.nome}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-[10px] text-zinc-700">{corretor.email || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-[10px] text-zinc-700">{corretor.celular || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-[10px] text-zinc-700">{corretor.imoveis_vinculados?.length || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap sticky right-0 bg-white">
                        <div className="flex items-center space-x-3">
                          <button className="text-black font-bold hover:text-gray-700 bg-gray-100 p-2 rounded-md" title="Editar" onClick={() => handleEdit(corretor.codigoD)}><PencilSquareIcon className="h-5 w-5" /></button>
                          <button className="text-red-500 font-bold hover:text-red-400 bg-gray-100 p-2 rounded-md" title="Deletar Imóvel" onClick={() => handleDelete(corretor.codigoD)}><TrashIcon className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} className="px-6 py-4 text-center text-[10px] text-gray-500">Nenhum corretor encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <Pagination pagination={pagination} onPageChange={handlePageChange} />
          </div>
        </div>
      </div>
    </AuthCheck>
  );
}
