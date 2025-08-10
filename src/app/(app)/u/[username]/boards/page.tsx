'use client'
import BoardCardComponent from '@/components/BoardCardComponents'
import { ApiResponse } from '@/utils/ApiResponse'
import axios, { AxiosError } from 'axios'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import CreateBoardTemplate from '@/components/CreateBoardTemplate'
import { Star, User } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface Board {
    name: string
    url: string
    bgColor: string
    _id: string
    isStarred: boolean
}

const BoardPage = () => {
    const [boardPage, setBoardPage] = useState(1)
    const [boardLimit, setBoardLimit] = useState(10)
    const [loadMore, setLoadMore] = useState(false)
    const [loading, setLoading] = useState(false)
    const [boardInfo, setBoardInfo] = useState<Board[]>([])
    const [starredBoards, setStarredBoards] = useState<Board[]>([])
    const [starredBoardLoading, setStarredBoardLoading] = useState(false)

    useEffect(() => {
        const fetchStarredBoards = async () => {
            try {
                setStarredBoardLoading(true)
                const response = await axios.get('/api/boards/getStarredBoards')
                setStarredBoards(response.data.data.boards)

                // console.log("Starred response: ", response)
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
        const getUserBoards = async () => {
            setLoadMore(true)
            setLoading(true)
            try {
                const response = await axios.get(`/api/boards/getAllUserBoards?page=${boardPage}&limit=${boardLimit}`)
                console.log(response, "fes");
                setBoardInfo(response.data.data.boards)

            } catch (error) {
                const axiosError = error as AxiosError<ApiResponse>
                const errMsg = axiosError.response?.data.message
                toast('Error fetching user boards', {
                    description: errMsg,
                })
            } finally {
                setLoadMore(false)
                setLoading(false)
            }
        }

        getUserBoards()
    }, [])

    useEffect(() => {
        if (boardInfo.length > 0 && !loading && !starredBoardLoading) {
            const starredBoardIds = new Set(starredBoards?.map((board) => board._id))

            const needsUpdate = boardInfo.some(board =>
                starredBoardIds.has(board._id) !== board.isStarred
            )

            if (needsUpdate) {
                const updatedBoards = boardInfo.map((board) => ({
                    ...board,
                    isStarred: starredBoardIds.has(board._id)
                }))
                setBoardInfo(updatedBoards)
            }
        }
    }, [starredBoards, loading, starredBoardLoading, boardInfo])

    // Listen for synchronization events from other components
    useEffect(() => {
        const handleBoardStarredToggle = async (event: CustomEvent) => {
            const { boardId, isStarred: newStarredStatus } = event.detail
            
            // Update boardInfo list
            setBoardInfo(prev => prev.map(board => 
                board._id === boardId 
                    ? { ...board, isStarred: newStarredStatus }
                    : board
            ))
            
            // Update starred boards list
            if (newStarredStatus) {
                // Refetch starred boards to get complete data
                try {
                    const response = await axios.get('/api/boards/getStarredBoards')
                    setStarredBoards(response.data.data.boards)
                } catch (error) {
                    console.log("Error syncing starred boards", error)
                }
            } else {
                // Remove from starred boards
                setStarredBoards(prev => prev.filter(board => board._id !== boardId))
            }
        }

        window.addEventListener('boardStarredToggle', ((event: Event) => {
            const customEvent = event as CustomEvent<{ boardId: string; isStarred: boolean }>
            handleBoardStarredToggle(customEvent)
        }) as EventListener)
        
    }, [])

    const toggleStarredStatus = async (boardId: string, currentStarredStatus: boolean) => {
        try {
            const response = await axios.patch(`/api/boards/toggleBoardStarredStatus/${boardId}`)
            
            if (response.data.success) {
                const newStarredStatus = response.data.data.isStarred
                
                // Update boardInfo list
                setBoardInfo(prev => prev.map(board => 
                    board._id === boardId 
                        ? { ...board, isStarred: newStarredStatus }
                        : board
                ))
                
                // Update starred boards list
                if (newStarredStatus) {
                    // Refetch starred boards to get complete data
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
                return newStarredStatus
            }
        } catch (error) {
            console.log("Error toggling starred status", error);
            const axiosError = error as AxiosError<ApiResponse>
            const errMsg = axiosError.response?.data.message

            toast.error('Failed to update starred status', {
                description: errMsg
            })
            throw error
        }
    }

    const handleBoardCreated = (newBoard: Board) => {
        setBoardInfo(prev => [newBoard, ...prev]); // Add the new board to the start
    };
    

    return (
        <div>
            {starredBoards && starredBoards.length > 0 && (
                <div>
                    <div className='flex items-center mb-5 gap-2'>
                        <Star />
                        <span className='font-semibold text-lg'>Starred Boards</span>
                    </div>
                    <div className='flex flex-wrap'>
                        {starredBoards?.map((board) =>
                            <BoardCardComponent 
                                key={board._id} 
                                name={board.name} 
                                _id={board._id} 
                                bgColor={board.bgColor} 
                                isStarred={true} 
                                url={board.url}
                                onToggleStar={toggleStarredStatus}
                            />
                        )}
                    </div>
                </div>
            )}

            <Separator className='my-3' />

            <div className='flex items-center mb-5 gap-2'>
                <User />
                <span className='font-semibold text-lg'>Your Boards</span>
            </div>

            <div className='flex flex-wrap'>
                {boardInfo?.map((board) =>
                    <BoardCardComponent 
                        key={board._id} 
                        name={board.name} 
                        _id={board._id} 
                        bgColor={board.bgColor} 
                        isStarred={board.isStarred} 
                        url={board.url}
                        onToggleStar={toggleStarredStatus}
                    />
                )}

                <Popover>
                    <PopoverTrigger asChild>
                        <div className={`w-48 h-24 px-2 pr-4 py-1 rounded-sm mx-5 mb-6 flex justify-center items-center bg-gray-700 hover:bg-gray-600`}>
                            <p className='relative text-white text-sm'>
                                Create new board
                            </p>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                        <CreateBoardTemplate onBoardCreated={handleBoardCreated} />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}

export default BoardPage