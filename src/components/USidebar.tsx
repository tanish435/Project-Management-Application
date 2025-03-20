'use client'
import React, { memo, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { AppWindow, Home, Layers, Star, User } from 'lucide-react'
import Link from 'next/link'
import { Separator } from './ui/separator'

const USidebar = () => {
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
                <Link href={'/'}>
                    <Button className='w-full bg-transparent flex justify-normal hover:bg-slate-700'>
                        <AppWindow className='' />
                        Boards
                    </Button>
                </Link>
            </div>
            <div className='p-1'>
                <Link href={'/'}>
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
                <Link href={'/'}>
                    <Button className='w-full bg-transparent flex justify-normal hover:bg-slate-700'>
                        <AppWindow className='' />
                        Boards
                    </Button>
                </Link>
            </div>
            <div className='p-1'>
                <Link href={'/'}>
                    <Button className='w-full bg-transparent flex justify-normal hover:bg-slate-700'>
                        <Star className='' />
                        Starred Boards
                    </Button>
                </Link>
            </div>
            <div className='p-1'>
                <Link href={'/'}>
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