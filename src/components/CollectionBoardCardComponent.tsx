    import { Plus, Star } from 'lucide-react'
    import Link from 'next/link'
    import React, { useEffect, useState } from 'react'
    import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
    import { Button } from './ui/button'
    import CreateCollectionTemplate from './CreateCollectionTemplate'
    import axios, { AxiosError } from 'axios'
    import { ApiResponse } from '@/utils/ApiResponse'
    import { toast } from 'sonner'
    import { Badge } from './ui/badge'
    import { cp } from 'fs'

    interface Collection {
        _id: string
        name: string
        boards: string[]
    }

    interface BoardCardProps {
        name: string
        url: string
        bgColor: string
        _id: string
        isStarred: boolean
        collections: Collection[]
        onCollectionCreated: (newCollection: Collection) => void
        onCollectionUpdated: (updatedCollection: Collection) => void
        onCollectionDeleted: (deletedCollection: Collection) => void
    }

    const CollectionBoardCardComponent = ({ name, url, bgColor, _id, isStarred, collections, onCollectionCreated, onCollectionUpdated, onCollectionDeleted }: BoardCardProps) => {
        const [collection, setCollection] = useState<Collection[]>(collections)
        const [boardCollections, setBoardCollections] = useState<Collection[]>(() =>
            collections.filter((coll) => coll.boards?.includes(_id))
        )

        const addCollection = async (collection: Collection) => {
            try {
                const response = await axios.patch(`/api/collections/addBoardToCollection/${collection._id}/${_id}`)
                if (response?.data?.success) {
                    const updatedCollection = response.data.data?.collection

                    setBoardCollections((prev) => prev.concat(collection))
                }
            } catch (error) {
                console.log("Error adding board to collection");
                const axiosError = error as AxiosError<ApiResponse>
                const errMsg = axiosError.response?.data.message

                toast.error('Failed to add board to collection', {
                    description: errMsg
                })
            }
        }


        const removeCollection = async (collection: Collection) => {
            try {
                const response = await axios.patch(`/api/collections/removeBoardFromCollection/${collection._id}/${_id}`)
                if (response?.data?.success) {
                    const updatedCollection = response.data.data.collection
                    setBoardCollections((prev) =>
                        prev?.filter((coll) => coll._id !== collection._id)
                    )
                }
            } catch (error) {
                console.log("Error removing board from collection");
                const axiosError = error as AxiosError<ApiResponse>
                const errMsg = axiosError.response?.data.message
    
                toast.error('Failed to remove board from collection', {
                    description: errMsg
                })
            }
        }

        const handleToggleCollection = async (collection: Collection) => {
            if (!collection || !collection._id) return;

            const isInBoardCollections = boardCollections.some(
                (coll) => coll && coll._id === collection._id
            )

            try {
                if (isInBoardCollections) {
                    await removeCollection(collection)
                } else {
                    await addCollection(collection)
                }
            } catch (error) {
                const axiosError = error as AxiosError<ApiResponse>;
                toast.error('Failed to update collection', {
                    description: axiosError.response?.data.message
                });
            }
        }

        useEffect(() => {
            if (collections.length > 0) {
                const collectionsWithBoard = collections.filter((coll) =>
                    coll && coll.boards && coll.boards.includes(_id)
                );
                setBoardCollections(collectionsWithBoard);
            }
        }, [collections, _id]);

        return (
            <div className='flex flex-col justify-center gap-1 items-center w-64'>
                <div className={`w-64 h-24 px-2 pr-4 py-1 rounded-sm  flex justify-between items-start ${bgColor}`}>
                    <Link href={`/b/${url}/${name.trim().toLowerCase().replace(/\s+/g, '-')}`}>
                        <p className='relative top-0 left-0 text-white text-md font-bold'>
                            {`${name}`}
                        </p>
                        {isStarred ?
                            <Star fill='yellow' strokeWidth={'0.5'} className='mt-1 h-4 w-4 relative bottom-0 right-0' />
                            :
                            <Star strokeWidth={'1.6'} color='white' className='mt-1 h-4 w-4 relative bottom-0 right-0' />
                        }
                    </Link>

                </div>
                <div className='w-full grid grid-cols-[1fr_auto] items-start'>
                {/* <div className='w-full flex items-center'> */}
                    <div className='flex flex-wrap gap-1 pr-2 overflow-hidden'>
                    {/* <div className='flex flex-wrap flex-grow gap-1'> */}
                        {boardCollections?.map(collection => (
                            collection && collection._id && collection.name ? (
                                <Badge
                                    key={collection._id}
                                    className='bg-slate-800 font-semibold'
                                >
                                    {collection.name}
                                </Badge>
                            ) : null
                        ))}
                    </div>
                    <div className='flex-shrink-0'>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button className='bg-gray-800 hover:bg-gray-700 text-xs text-white p-0 h-6 w-6' variant="outline"><Plus /></Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0">
                                <CreateCollectionTemplate
                                    board={_id}
                                    boardCollections={boardCollections}
                                    collections={collections}
                                    onCollectionCreated={onCollectionCreated}
                                    onCollectionUpdated={onCollectionUpdated}
                                    onCollectionDeleted={onCollectionDeleted}
                                    onChangeCollection={handleToggleCollection}
                                />
                            </PopoverContent>
                        </Popover>

                    </div>
                </div>                
            </div>
        )

    }

    export default CollectionBoardCardComponent