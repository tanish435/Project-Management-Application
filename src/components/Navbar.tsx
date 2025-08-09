'use client'
import { Session } from 'next-auth'
import { getSession, signOut } from 'next-auth/react'
import React, { useEffect, useState, useCallback } from 'react'
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
import { Computer, Moon, Star, Sun, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
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

interface PaginationState {
  page: number;
  limit: number;
  hasMore: boolean;
  total: number;
}

const Navbar = () => {
  const [userData, setUserData] = useState<Session | null>(null)
  const [boards, setBoards] = useState<Board[]>([])
  const [boardLoading, setBoardLoading] = useState(false)
  const [starredBoards, setStarredBoards] = useState<Board[]>([])
  const [starredBoardLoading, setStarredBoardLoading] = useState(false)
  
  const [boardsPagination, setBoardsPagination] = useState<PaginationState>({
    page: 1,
    limit: 5,
    hasMore: true,
    total: 0
  })
  
  const [starredPagination, setStarredPagination] = useState<PaginationState>({
    page: 1,
    limit: 5,
    hasMore: true,
    total: 0
  })

  const [boardsFetched, setBoardsFetched] = useState(false)
  const [starredBoardsFetched, setStarredBoardsFetched] = useState(false)

  const { setTheme } = useTheme()

  useEffect(() => {
    const fetchAuthenticatedUser = async () => {
      const sessionData = await getSession()
      setUserData(sessionData)
    }
    fetchAuthenticatedUser()
  }, [])

  const fetchUserBoards = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      setBoardLoading(true)
      const response = await axios.get(`/api/boards/getAllUserBoards?page=${page}&limit=${boardsPagination.limit}`)
      const newBoards = response.data.data.boards

      if (append) {
        setBoards(prev => [...prev, ...newBoards])
      } else {
        setBoards(newBoards)
      }

      setBoardsPagination(prev => ({
        ...prev,
        page,
        hasMore: newBoards.length === prev.limit,
        total: response.data.data.total || newBoards.length
      }))

      setBoardsFetched(true)

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
  }, [boardsPagination.limit])

  const fetchStarredBoards = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      setStarredBoardLoading(true)
      const response = await axios.get(`/api/boards/getStarredBoards?page=${page}&limit=${starredPagination.limit}`)
      const newStarredBoards = response.data.data.boards

      if (append) {
        setStarredBoards(prev => [...prev, ...newStarredBoards])
      } else {
        setStarredBoards(newStarredBoards)
      }

      setStarredPagination(prev => ({
        ...prev,
        page,
        hasMore: newStarredBoards?.length === prev.limit,
        total: response.data.data.total || newStarredBoards?.length
      }))

      setStarredBoardsFetched(true)

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
  }, [starredPagination.limit])

  const handleRecentHover = () => {
    if (!boardsFetched) {
      fetchUserBoards(1, false)
    }
  }

  const handleStarredHover = () => {
    if (!starredBoardsFetched) {
      fetchStarredBoards(1, false)
    }
  }

  const loadMoreBoards = () => {
    if (boardsPagination.hasMore && !boardLoading) {
      fetchUserBoards(boardsPagination.page + 1, true)
    }
  }

  const loadMoreStarredBoards = () => {
    if (starredPagination.hasMore && !starredBoardLoading) {
      fetchStarredBoards(starredPagination.page + 1, true)
    }
  }

  useEffect(() => {
    if (boards.length > 0 && starredBoards.length > 0 && !boardLoading && !starredBoardLoading) {
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

  const BoardList = ({ boards, loading, pagination, onLoadMore }: {
    boards: Board[],
    loading: boolean,
    pagination: PaginationState,
    onLoadMore: () => void
  }) => (
    <ul className="gap-3 p-2 md:w-[250px] max-h-96 overflow-y-auto">
      {boards.map((board) => (
        <Link key={board._id} href={`/b/${board.url}/${board.name.trim().toLowerCase().replace(/\s+/g, '-')}`}>
          <li className='my-1 hover:bg-slate-700 rounded p-1'>
            <div className='flex justify-between items-center'>
              <div className='flex items-center justify-center gap-2 text-gray-300 text-sm font-semibold'>
                <div className={`w-5 h-5 rounded ${board.bgColor}`}></div>
                {board.name}
              </div>
              {/* {board.isStarred ? 
                <Star fill='yellow' strokeWidth={0.5} className='h-3 w-3 mr-3' /> : 
                <Star className='h-3 w-3 mr-3' />
              } */}
            </div>
          </li>
        </Link>
      ))}
      
      {boards.length === 0 && !loading && (
        <li className='text-center text-gray-400 py-4'>No boards found</li>
      )}
      
      {loading && (
        <li className='text-center py-2'>
          <Loader2 className='h-4 w-4 animate-spin mx-auto' />
        </li>
      )}
      
      {pagination.hasMore && boards.length > 0 && (
        <li className='text-center py-2'>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadMore}
            disabled={loading}
            className='text-gray-300 hover:text-white'
          >
            {loading ? (
              <Loader2 className='h-4 w-4 animate-spin mr-2' />
            ) : (
              <ChevronDown className='h-4 w-4 mr-2' />
            )}
            Load More
          </Button>
        </li>
      )}
    </ul>
  )

  return (
    <div className='text-white h-16 w-full p-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>

          <Logo className='mr-3' />
          <div className='flex items-center gap-2'>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger 
                    className="bg-transparent active:!bg-slate-800"
                    onMouseEnter={handleRecentHover}
                  >
                    Recent
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-slate-800 text-gray-300 !border-none navigation-menu-content">
                    <BoardList
                      boards={boards}
                      loading={boardLoading}
                      pagination={boardsPagination}
                      onLoadMore={loadMoreBoards}
                    />
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger 
                    className="bg-transparent active:!bg-slate-800"
                    onMouseEnter={handleStarredHover}
                  >
                    Starred
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-slate-800 text-gray-300 !border-none navigation-menu-content">
                    <BoardList
                      boards={starredBoards}
                      loading={starredBoardLoading}
                      pagination={starredPagination}
                      onLoadMore={loadMoreStarredBoards}
                    />
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <Popover>
              <PopoverTrigger asChild>
                <Button className='bg-blue-400 text-black' variant="outline">Create</Button>
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
                <DropdownMenuItem>
                  Profile
                </DropdownMenuItem>
              </Link>
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