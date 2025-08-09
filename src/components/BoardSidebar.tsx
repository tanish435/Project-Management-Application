import { ApiResponse } from '@/utils/ApiResponse'
import axios, { AxiosError } from 'axios'
import { Session } from 'next-auth'
import { getSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarTrigger } from './ui/sidebar'
import { Star } from 'lucide-react'
import Link from 'next/link'
import { Separator } from './ui/separator'
import { Button } from './ui/button'

interface Board {
    name: string,
    bgColor: string,
    url: string,
    _id: string,
    isStarred: boolean
}

const BoardSidebar = () => {
    const [userData, setUserData] = useState<Session | null>(null)
    const [boards, setBoards] = useState<Board[]>([])
    const [boardLoading, setBoardLoading] = useState(false)
    const [starredBoards, setStarredBoards] = useState<Board[]>([])
    const [starredBoardLoading, setStarredBoardLoading] = useState(false)
    const [togglingBoards, setTogglingBoards] = useState<Set<string>>(new Set())

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

    // Listen for synchronization events from other components (like BoardNavbar)
    useEffect(() => {
        const handleBoardStarredToggle = async (event: Event) => {
            const { boardId, isStarred: newStarredStatus } = 
                (event as CustomEvent<{ boardId: string; isStarred: boolean }>).detail;
    
            // Don't process events triggered by this component
            if (togglingBoards.has(boardId)) return;
    
            // Update boards list immediately
            setBoards(prev =>
                prev.map(board =>
                    board._id === boardId
                        ? { ...board, isStarred: newStarredStatus }
                        : board
                )
            );
    
            // Update starred boards list
            if (newStarredStatus) {
                try {
                    const response = await axios.get('/api/boards/getStarredBoards');
                    setStarredBoards(response.data.data.boards);
                } catch (error) {
                    console.log("Error refreshing starred boards after external toggle");
                }
            } else {
                setStarredBoards(prev => prev.filter(board => board._id !== boardId));
            }
        };
    
        window.addEventListener('boardStarredToggle', handleBoardStarredToggle);
    
        return () => {
            window.removeEventListener('boardStarredToggle', handleBoardStarredToggle);
        };
    }, [togglingBoards]);
    

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

    const toggleStarredStatus = async (boardId: string, currentStarredStatus: boolean, event: React.MouseEvent) => {
        event.preventDefault() // Prevent navigation
        event.stopPropagation()
        
        if (togglingBoards.has(boardId)) return // Prevent multiple simultaneous requests
        
        setTogglingBoards(prev => new Set(prev).add(boardId))
        
        try {
            const response = await axios.patch(`/api/boards/toggleBoardStarredStatus/${boardId}`)
            
            if (response.data.success) {
                const newStarredStatus = response.data.data.isStarred
                
                // Update boards list
                setBoards(prev => prev.map(board => 
                    board._id === boardId 
                        ? { ...board, isStarred: newStarredStatus }
                        : board
                ))
                
                // Update starred boards list
                if (newStarredStatus) {
                    // Add to starred boards (fetch updated list to get complete data)
                    const starredResponse = await axios.get('/api/boards/getStarredBoards')
                    setStarredBoards(starredResponse.data.data.boards)
                } else {
                    // Remove from starred boards
                    setStarredBoards(prev => prev.filter(board => board._id !== boardId))
                }
                
                // Dispatch custom event for cross-component synchronization
                window.dispatchEvent(new CustomEvent('boardStarredToggle', {
                    detail: { boardId, isStarred: newStarredStatus }
                }))
                
                toast.success(response.data.message)
            }
        } catch (error) {
            console.log("Error toggling starred status", error);
            const axiosError = error as AxiosError<ApiResponse>
            const errMsg = axiosError.response?.data.message

            toast.error('Failed to update starred status', {
                description: errMsg
            })
        } finally {
            setTogglingBoards(prev => {
                const newSet = new Set(prev)
                newSet.delete(boardId)
                return newSet
            })
        }
    }

    return (
        <div className="">
            <Sidebar className='h-full top-16 overflow-y-auto border-r bg-slate-800'>
                <SidebarHeader className='px-3 mt-2 flex justify-center items-center'>
                    <div className='w-full'>{userData?.user.name}'s Workspace</div>
                    <Separator className='bg-gray-400'/>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel className='text-sm'>Your Boards</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {boards.map((board) => (
                                    <div key={board._id} className='my-1 hover:bg-slate-700 rounded p-1'>
                                        <div className='flex justify-between items-center'>
                                            <Link
                                                href={`/b/${board.url}/${board.name.trim().toLowerCase().replace(/\s+/g, '-')}`}
                                                className='flex items-center gap-2 text-gray-300 text-sm font-semibold flex-grow'
                                            >
                                                <div className={`w-5 h-5 rounded ${board.bgColor}`}></div>
                                                {board.name}
                                            </Link>
                                            
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="p-1 h-auto hover:bg-slate-600 rounded mr-1"
                                                onClick={(e) => toggleStarredStatus(board._id, board.isStarred, e)}
                                                disabled={togglingBoards.has(board._id)}
                                                title={board.isStarred ? "Remove from starred boards" : "Add to starred boards"}
                                            >
                                                {board.isStarred ? (
                                                    <Star 
                                                        fill='yellow' 
                                                        strokeWidth={0.5} 
                                                        className={`h-4 w-4 transition-opacity ${
                                                            togglingBoards.has(board._id) ? 'opacity-50' : ''
                                                        }`} 
                                                    />
                                                ) : (
                                                    <Star 
                                                        className={`h-4 w-4 transition-opacity hover:fill-yellow-200 ${
                                                            togglingBoards.has(board._id) ? 'opacity-50' : ''
                                                        }`} 
                                                    />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>
        </div>
    )
}

export default BoardSidebar