'use client';
import { useSession, signIn, signOut } from "next-auth/react";

export default function Component() {
    const { data: session } = useSession();

    if (session) {
        return (
            <div className="p-4">
                <p>_id: {session.user._id}</p>
                <p>isVerified: {session.user.isVerified === true ? 'true':'false'}</p>
                <p>username: {session.user.username}</p>
                <p>sub: {session.user.sub}</p>
                <p>Name: {session.user.name}</p>
                <p>Signed in as {session.user.email}</p>
                <p>image: {session.user.image}</p>
                
                {session.user.image && (
                    <img
                        src={session.user.image}
                        alt="Profile"
                        className="rounded-full w-16 h-16"
                    />
                )}
                <button
                    className="bg-red-400 text-white p-2 mt-3 rounded-lg"
                    onClick={() => signOut()}
                >
                    Sign out
                </button>
            </div>
        );
    }

    return (
        <div className="p-4">
            <p>Not signed in</p>
            <button
                className="bg-green-400 p-2 m-3 rounded-lg"
                onClick={() => signIn()}
            >
                Sign in
            </button>
        </div>
    );
}
