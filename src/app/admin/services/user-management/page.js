'use client'

import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import AuthCheck from "../../components/auth-check";

export default function UserManagement() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        // Fetch users from Firebase Admin SDK
        // This requires server-side logic with Firebase Admin SDK
        // Placeholder for fetching users
        setUsers([/* Example users */]);
    }, []);

    const handleUpdateUser = (userId) => {
        // Logic to update user
        console.log("Update user", userId);
    };

    const handleDeleteUser = (userId) => {
        // Logic to delete user
        console.log("Delete user", userId);
    };

    return (
        <AuthCheck>
            <div>
                <h1>Gerenciamento de Usuários</h1>
                <ul>
                    {users.map((user) => (
                        <li key={user.id}>
                            {user.email}
                            <button onClick={() => handleUpdateUser(user.id)}>Atualizar</button>
                            <button onClick={() => handleDeleteUser(user.id)}>Excluir</button>
                        </li>
                    ))}
                </ul>
            </div>
        </AuthCheck>
    );
} 