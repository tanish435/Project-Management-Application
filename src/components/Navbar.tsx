'use client'
import { Session } from 'next-auth'
import { getSession, signOut } from 'next-auth/react'
import React, { useEffect, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import Logo from './Logo'
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from './ui/navigation-menu'
import axios, { AxiosError } from 'axios'
import { toast } from 'sonner'
import { ApiResponse } from '@/utils/ApiResponse'
import Link from 'next/link'
import { Computer, Moon, Star, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import CreateBoardTemplate from './CreateBoardTemplate'
import { Button } from './ui/button'

interface Board {
  name: string,
  bgColor: string,
  url: string,
  _id: string,
  isStarred: boolean
}

const Navbar = () => {
  const [userData, setUserData] = useState<Session | null>(null)
  const [boards, setBoards] = useState<Board[]>([])
  const [boardLoading, setBoardLoading] = useState(false)
  const [starredBoards, setStarredBoards] = useState<Board[]>([])
  const [starredBoardLoading, setStarredBoardLoading] = useState(false)

  const { setTheme } = useTheme()

  useEffect(() => {
    const fetchAuthenticatedUser = async () => {
      const sessionData = await getSession()
      setUserData(sessionData)
    }
    fetchAuthenticatedUser()
  }, [])

  useEffect(() => {
    const fetchUserBoards = async () => {
      try {
        setBoardLoading(true)
        const response = await axios.get('/api/boards/getAllUserBoards')
        setBoards(response.data.data.boards)

      } catch (error) {
        console.log("Error fetching user boards");
        const axiosError = error as AxiosError<ApiResponse>
        const errMsg = axiosError.response?.data.message

        toast.error('Failed to fetch boards', {
          description: errMsg
        })
      } finally {
        setBoardLoading(false)
      }
    }

    fetchUserBoards()
  }, [])


  useEffect(() => {
    const fetchStarredBoards = async () => {
      try {
        setStarredBoardLoading(true)
        const response = await axios.get('/api/boards/getStarredBoards')
        setStarredBoards(response.data.data.boards)

        console.log("Starred response: ", response)
      } catch (error) {
        console.log("Error fetching starred boards");
        const axiosError = error as AxiosError<ApiResponse>
        const errMsg = axiosError.response?.data.message

        toast.error('Failed to fetch starred boards', {
          description: errMsg
        })
      } finally {
        setStarredBoardLoading(false)
      }
    }

    fetchStarredBoards()
  }, [])

  useEffect(() => {
    if (boards.length > 0 && !boardLoading && !starredBoardLoading) {
      const starredBoardIds = new Set(starredBoards.map((board) => board._id))

      const needsUpdate = boards.some(board =>
        starredBoardIds.has(board._id) !== board.isStarred
      )

      if (needsUpdate) {
        const updatedBoards = boards.map((board) => ({
          ...board,
          isStarred: starredBoardIds.has(board._id)
        }))
        setBoards(updatedBoards)
      }
    }
  }, [starredBoards, boardLoading, starredBoardLoading, boards])

  useEffect(() => {
    console.log("Updated boards:", boards);
    console.log("Starred boards:", starredBoards);
  }, [boards, starredBoards]);

  return (
    <div className='text-white fixed w-full p-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>

          <Logo className='mr-3' />
          <div className='flex items-center'>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  {/* <NavigationMenuTrigger className="bg-transparent  active:!bg-slate-600 data-[state=open]:!bg-slate-600 transition-none"> */}
                  <NavigationMenuTrigger className="bg-transparent  active:!bg-slate-800">
                    Recent
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-slate-800 text-gray-300 !border-none navigation-menu-content">
                    <ul className="gap-3 p-2 md:w-[300px]">
                      {boards.map((board) => (
                        <Link key={board._id} href={`/b/${board.url}/${board.name.trim().toLowerCase().replace(/\s+/g, '-')}`}>
                          <li className='my-1 hover:bg-slate-700 rounded p-1'>
                            <div className='flex justify-between items-center'>
                              <div className='flex items-center justify-center gap-2 text-gray-300 text-sm font-semibold'>
                                <div className={`w-5 h-5 rounded ${board.bgColor}`}></div>
                                {board.name}
                              </div>
                              {
                                board.isStarred ? <Star fill='yellow' strokeWidth={0.5} className='h-3 w-3 mr-3' /> : <Star className='h-3 w-3 mr-3' />
                              }

                            </div>
                          </li>
                        </Link>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  {/* <NavigationMenuTrigger className="bg-transparent  active:!bg-slate-600 data-[state=open]:!bg-slate-600 transition-none"> */}
                  <NavigationMenuTrigger className="bg-transparent  active:!bg-slate-800">
                    Starred
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-slate-800 text-gray-300 !border-none navigation-menu-content">
                    <ul className="gap-3 p-2 md:w-[300px]">
                      {starredBoards.map((board) => (
                        <Link key={board._id} href={`/b/${board.url}/${board.name.trim().toLowerCase().replace(/\s+/g, '-')}`}>
                          <li className='my-1 hover:bg-slate-700 rounded p-1'>
                            <div className='flex justify-between items-center'>
                              <div className='flex items-center justify-center gap-2 text-gray-300 text-sm font-semibold'>
                                <div className={`w-5 h-5 rounded ${board.bgColor}`}></div>
                                {board.name}
                              </div>
                              {
                                <Star fill='yellow' strokeWidth={0.5} className='h-3 w-3 mr-3' />
                              }

                            </div>
                          </li>
                        </Link>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <Popover>
              <PopoverTrigger asChild>
                <Button className='bg-blue-400  text-black' variant="outline">Create</Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <CreateBoardTemplate />
              </PopoverContent>
            </Popover>
          </div>

        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar>
              <AvatarImage src={userData?.user.image as string} alt={userData?.user.username} />
              <AvatarFallback>{userData?.user.initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link href={'/profile'}>
                <DropdownMenuItem >
                  Profile
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      Light
                      <DropdownMenuShortcut><Sun className='h-4 w-4' /></DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      Dark
                      <DropdownMenuShortcut><Moon className='h-4 w-4' /></DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                      System
                      <DropdownMenuShortcut><Computer className='h-4 w-4' /></DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <Link href={'/support'}>
              <DropdownMenuItem>Support</DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default Navbar