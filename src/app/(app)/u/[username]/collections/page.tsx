'use client'
import CollectionBoardCardComponent from '@/components/CollectionBoardCardComponent'
import { ApiResponse } from '@/utils/ApiResponse'
import axios, { AxiosError } from 'axios'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Board {
    name: string
    url: string
    bgColor: string
    _id: string
    isStarred: boolean
}

interface Collection {
    _id: string
    name: string
    boards: string[]
}

const page = () => {
    const [boardPage, setBoardPage] = useState(1)
    const [boardLimit, setBoardLimit] = useState(10)
    const [loadMore, setLoadMore] = useState(false)
    const [loading, setLoading] = useState(false)
    const [boardInfo, setBoardInfo] = useState<Board[]>([])
    const [starredBoards, setStarredBoards] = useState<Board[]>([])
    const [starredBoardLoading, setStarredBoardLoading] = useState(false)
    const [collections, setCollections] = useState<Collection[]>([])

    const handleCollectionCreated = (newCollection: Collection) => {
        setCollections((prev) => [...prev, newCollection])
    }

    const handleCollectionUpdated = (updatedCollection: Collection) => {
        if (!updatedCollection || !updatedCollection._id) return;

        setCollections((prev) =>
            prev.map((collection) =>
                collection._id === updatedCollection._id
                    ? updatedCollection
                    : collection
            )
        );
    }

    useEffect(() => {
        const fetchInitialCollections = async() => {
            try {
                const response = await axios.get('/api/collections/getUserCollections')
                if(response?.data?.success) {
                    setCollections(response.data.data)
                } 
            } catch (error) {
                console.error("Error fetching initial collections:", error);
            }
        }

        fetchInitialCollections()
    }, [])


    const handleCollectionDeleted = (deletedCollection: Collection) => {
        setCollections((prev) => prev.filter((collection) => deletedCollection._id !== collection._id))
    }

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

    useEffect(() => {
        if (boardInfo.length > 0 && !loading && !starredBoardLoading) {
            const starredBoardIds = new Set(starredBoards.map((board) => board._id))

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

    useEffect(() => {
        const fetchCollections = async () => {
            try {
                const response = await axios.get('/api/collections/getUserCollections')
                setCollections(response.data.data)
            } catch (error) {
                const axiosError = error as AxiosError<ApiResponse>
                const errMsg = axiosError.response?.data.message
                toast('Error fetching user collections', {
                    description: errMsg,
                })
            }
        }

        fetchCollections()
    }, [])

    useEffect(() => {
        console.log("page collections update check: ", collections);
        console.log("page collections name update check: ", collections);

    }, [collections])

    return (
        <div className='flex flex-wrap gap-6'>
            {boardInfo?.map((board) =>
                <CollectionBoardCardComponent
                    key={board._id}
                    name={board.name}
                    _id={board._id}
                    bgColor={board.bgColor}
                    isStarred={board.isStarred}
                    url={board.url}
                    collections={collections}
                    onCollectionCreated={handleCollectionCreated}
                    onCollectionUpdated={handleCollectionUpdated}
                    onCollectionDeleted={handleCollectionDeleted}
                />
            )}
        </div>
    )
}

export default page