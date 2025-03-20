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

interface Board {
    name: string
    url: string
    bgColor: string
    _id: string
}

const BoardPage = () => {
    const [boardPage, setBoardPage] = useState(1)
    const [boardLimit, setBoardLimit] = useState(10)
    const [loadMore, setLoadMore] = useState(false)
    const [loading, setLoading] = useState(false)
    const [boardInfo, setBoardInfo] = useState<Board[]>()

    useEffect(() => {
        const getUserBoards = async () => {
            setLoadMore(true)
            setLoading(true)
            try {
                const response = await axios.get(`/api/boards/getAllUserBoards?page=${boardPage}&limit=${boardLimit}`)
                console.log(response);
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

    return (
        <div className='flex flex-wrap'>
            {boardInfo?.map((board) =>
                <BoardCardComponent key={board._id} name={board.name} _id={board._id} bgColor={board.bgColor} isStarred={false} url={board.url} />
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
                    <CreateBoardTemplate />
                </PopoverContent>
            </Popover>
        </div>
    )
}

export default BoardPage