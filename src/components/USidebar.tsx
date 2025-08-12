'use client'
import React, { memo } from 'react'
import { Button } from './ui/button'
import { AppWindow, FileQuestion, Home, Layers, User } from 'lucide-react'
import Link from 'next/link'
import { Separator } from './ui/separator'
import { useSession } from 'next-auth/react'

const USidebar = () => {
    const {data: session} = useSession()
    const username = session?.user?.username
    return (
        <div className="w-56 hidden md:block">
            <div className='p-1'>
                <Link href={'/'}>
                    <Button className='w-full bg-transparent flex justify-normal hover:bg-slate-700'>
                        <Home size={9} />
                        Home
                    </Button>
                </Link>
            </div>
            <div className='p-1'>
                <Link href={`/u/${username}/boards`}>
                    <Button className='w-full bg-transparent flex justify-normal hover:bg-slate-700'>
                        <AppWindow className='' />
                        Boards
                    </Button>
                </Link>
            </div>
            <div className='p-1'>
                <Link href={`/u/${username}/collections`}>
                    <Button className='w-full bg-transparent flex justify-normal hover:bg-slate-700'>
                        <Layers className='' />
                        Collections
                    </Button>
                </Link>
            </div>

            <Separator className="my-4" />

            <div className='text-gray-400 text-sm font-bold'>
                Workspace
            </div>
            <div className='p-1'>
                <Link href={`/u/${username}/boards`}>
                    <Button className='w-full bg-transparent flex justify-normal hover:bg-slate-700'>
                        <AppWindow className='' />
                        Boards
                    </Button>
                </Link>
            </div>
            <div className='p-1'>
                <Link href={`/support`}>
                    <Button className='w-full bg-transparent flex justify-normal hover:bg-slate-700'>
                        <FileQuestion className='' />
                        Support
                    </Button>
                </Link>
            </div>
            <div className='p-1'>
                <Link href={'/profile'}>
                    <Button className='w-full bg-transparent flex justify-normal hover:bg-slate-700'>
                        <User className='' />
                        Profile
                    </Button>
                </Link>
            </div>
        </div>
    );
}

export default memo(USidebar);  