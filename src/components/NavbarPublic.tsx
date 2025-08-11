'use client'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Logo from "./Logo"

export default function NavbarPublic() {
    return (
        <nav className="w-full h-16 flex items-center justify-between px-6 bg-slate-900 text-white">
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-md p-2">
                    <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <rect x="3" y="4" width="7" height="5" rx="1" fill="white" />
                        <rect x="14" y="4" width="7" height="5" rx="1" fill="white" />
                        <rect x="3" y="15" width="7" height="5" rx="1" fill="white" />
                        <rect x="14" y="15" width="7" height="5" rx="1" fill="white" />
                    </svg>
                </div>
                <span className="font-semibold font-sansation text-xl">Atlas</span>
            </div>

            <div className="hidden md:flex items-center gap-3 text-sm text-slate-300">
                <Button asChild variant="ghost">
                    <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild>
                    <Link href="/sign-up">Get started</Link>
                </Button>
            </div>

            <div className="md:hidden">
                <Button variant="ghost">Menu</Button>
            </div>
        </nav>
    )
}
