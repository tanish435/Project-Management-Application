import 'next-auth'
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            _id: string;
            isVerified: boolean;
            username: string
            sub: string
            initials: string
        } & DefaultSession['user']
    }

    interface User {
        _id: string;
        initials: string;
        isVerified: boolean;
        username: string
        sub: string
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        _id: string;
        isVerified: boolean;
        username: string
        image: string
    }
}