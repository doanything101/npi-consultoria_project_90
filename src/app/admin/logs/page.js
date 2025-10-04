"use client";

import { useEffect, useState } from "react";
import AuthCheck from "../components/auth-check";
import { buscarLogs } from "../services/log-service";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { TrashIcon } from "lucide-react";

// Disable static generation for admin pages
export const dynamic = 'force-dynamic';

export default function Logs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    buscarLogs().then((data) => {
      setLogs(data.data);
    });
  }, []);

  return (
    <AuthCheck>
      <div className="">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Logs</h1>
            <button className="bg-red-500 text-white px-4 py-2 rounded-md">Limpar Logs</button>
          </div>

          <div className="relative overflow-x-auto mt-6">
            <div className="h-[500px] overflow-y-auto rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 rounded-lg ">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-[10px] font-bold tracking-wider capitalize"
                    >
                      Usuário
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-[10px] font-bold tracking-wider capitalize"
                    >
                      E-mail
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-[10px] font-bold tracking-wider"
                    >
                      Data
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-[10px] font-bold tracking-wider"
                    >
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 h-[500px]">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-6 bg-gray-50 py-4 whitespace-nowrap text-[10px] text-gray-900 font-bold capitalize">
                        {log.user || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[10px] text-gray-900 font-bold capitalize">
                        {log.email.toLowerCase() || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[10px] text-zinc-700">
                        {new Date(log.data).toLocaleString() || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[10px] text-zinc-700">
                        {log.action || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AuthCheck>
  );
}
